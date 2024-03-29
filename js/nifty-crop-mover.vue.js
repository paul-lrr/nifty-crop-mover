Vue.component("item-select", {
  template: /*html*/ `<select id="select-item" :value="value" @input="handleInput">
			<option disabled value="">Select an Item</option>
			<optgroup v-for="(scene,s) in itemList" v-if="scene.items.length>0" :label="scene.sceneName">
				<option v-for="(item,i) in scene.items" :value="item.sceneName+'\uF000'+item.sceneItemId" :key="scene.sceneName+item.sourceName+item.sceneItemId" :selected="item.sceneName+'\uF000'+item.sceneItemId === value.sceneName+'\uF000'+value.sceneItemId">
        {{item.isGroup?"🖿 ":""}}{{item.inGroup?" ":""}}{{item.sourceName}}
        </option>
			</optgroup>
			</select>`,
  props: ["itemList", "value"],
  computed: {
    flatItemList() {
      return this.itemList.flatMap((o) => o.items);
    },
  },
  methods: {
    handleInput(e) {
      let indexes = e.target.value.split("\uF000");
      let target = this.flatItemList.find((o) => o.sceneName == indexes[0] && o.sceneItemId == indexes[1]);
      if (target) {
        this.$emit("input", target);
      }
    },
  },
});
Vue.component("move-resize", {
  template: /*html*/ `<div id="move-resize-container">
	    	<div id="frame" ref="frame" :style="frameStyle">
		
		<div id="item" ref="item" :style="itemStyle" @mousedown.self.prevent="startDrag" :class={oversize:oversize}>

			<div id="h-tl" class="handle" @mousedown.prevent="startScale({x:'left',y:'top'})"></div>
			<div id="h-tr" class="handle" @mousedown.prevent="startScale({x:'right',y:'top'})"></div>
			<div id="h-bl" class="handle" @mousedown.prevent="startScale({x:'left',y:'bottom'})"></div>
			<div id="h-br" class="handle" @mousedown.prevent="startScale({x:'right',y:'bottom'})"></div>
		</div>
    </div>
	</div>`,
  props: ["frame", "item", "oversize"],
  data: () => ({
    frameOrigin: { left: 0, top: 0 },
  }),
  computed: {
    itemOrigin() {
      let originX = this.frame.left - this.item.left + this.frame.originX;
      let originY = this.frame.top - this.item.top + this.frame.originY;
      return originX + "px " + originY + "px";
    },
    frameStyle() {
      return {
        top: this.frame.top,
        right: this.frame.right,
        bottom: this.frame.bottom,
        left: this.frame.left,
        "transform-origin": this.frame.alignY + " " + this.frame.alignX,
        transform: "rotate(" + this.frame.rotateZ + "deg)",
      };
    },
    itemStyle() {
      return {
        top: this.item.top - this.frame.top,
        right: this.item.right - this.frame.right,
        bottom: this.item.bottom - this.frame.bottom,
        left: this.item.left - this.frame.left,
      };
    },
  },
  methods: {
    startDrag(e) {
      this.$emit("set-mode", {
        action: "drag",
      });
    },
    startScale(e) {
      this.$emit("set-mode", {
        action: "scale",
        x: e.x,
        y: e.y,
      });
    },
    getInfo(ref) {
      return this.$refs[ref].getBoundingClientRect();
    },
  },
  mounted() {
    this.frameOrigin = `${this.item.left - this.frame.left}px ${this.item.top - this.frame.top}px`;
  },
});

let app = new Vue({
  el: "#app",
  data: {
    targetItem: {},
    mode: false,
    slow: false,
    centerScale: false,
    item: {
      bottom: 0,
      right: 0,
      left: 0,
      top: 0,
    },
    appInfo: {
      stage: {
        width: 1920,
        height: 1080,
      },
      frame: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
        canvasRotate: 0,
        rotateZ: 0,
      },
      item: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: false,
        height: false,
        nativeWidth: false,
        nativeHeight: false,
        scale: { x: 1, y: 1 },
      },
      target: false,
    },
    obsTarget: false,
    itemList: false,
    displayWidth: 400,
    lastCropUpdate: Date.now(),
    socketConnected: false,
    socketserver: "ws://localhost:4455",
    socketpassword: "",
    loginError: "",
  },
  computed: {
    stageRatio() {
      return this.appInfo.stage.width / this.stage.width;
    },
    oversize() {
      return this.percent > 100;
    },
    percent() {
      if (this.appInfo.item.nativeWidth) {
        let itemWidth = (this.stage.width - this.item.right - this.item.left) * this.stageRatio;
        return _.round((itemWidth / this.appInfo.item.nativeWidth) * 100, 2);
      } else {
        return "";
      }
    },
    frame() {
      return {
        top: this.appInfo.frame.top / this.stageRatio,
        right: this.appInfo.frame.right / this.stageRatio,
        bottom: this.appInfo.frame.bottom / this.stageRatio,
        left: this.appInfo.frame.left / this.stageRatio,
        originX: (this.appInfo.stage.width - this.appInfo.frame.right - this.appInfo.frame.left) / this.stageRatio / 2,
        originY: (this.appInfo.stage.height - this.appInfo.frame.top - this.appInfo.frame.bottom) / this.stageRatio / 2,
        canvasRotate: this.appInfo.frame.canvasRotate,
        rotateZ: this.appInfo.frame.rotateZ,
        alignY: this.appInfo.frame.alignY,
        alignX: this.appInfo.frame.alignX,
      };
    },
    stage() {
      let ratio = this.appInfo.stage.width / this.displayWidth;
      return {
        width: this.appInfo.stage.width / ratio,
        height: this.appInfo.stage.height / ratio,
        left: 0,
        top: 0,
      };
    },
  },
  watch: {
    targetItem(value) {
      if (value) {
        this.obsTarget = value;
        this.setupStageObs();
      }
    },
    displayWidth(value, oldValue) {
      let ratioChange = value / oldValue;
      this.item = {
        top: this.item.top * ratioChange,
        right: this.item.right * ratioChange,
        bottom: this.item.bottom * ratioChange,
        left: this.item.left * ratioChange,
      };
    },
  },
  methods: {
    handleWheel(e) {
      if (this.appInfo.item.width) {
        this.displayWidth = Math.max(50, Math.min(this.displayWidth - e.deltaY / 2, 1920));
      }
    },
    handleMode(mode) {
      this.mode = mode;
    },
    handleMouseMove(e) {
      let rotated;
      if (this.mode.action) {
        rotated = this.rotate(e.movementX, e.movementY, 0, 0, -this.frame.rotateZ);
      }
      if (this.mode.action == "drag") {
        let bounds = {
          top: this.item.top + (this.slow ? rotated[1] / this.stageRatio : rotated[1]),
          right: this.item.right - (this.slow ? rotated[0] / this.stageRatio : rotated[0]),
          bottom: this.item.bottom - (this.slow ? rotated[1] / this.stageRatio : rotated[1]),
          left: this.item.left + (this.slow ? rotated[0] / this.stageRatio : rotated[0]),
        };
        this.item = this.checkBounds(bounds);
        this.setCropThrottle();
      }
      if (this.mode.action == "scale") {
        let bounds = {
          top: this.item.top,
          right: this.item.right,
          bottom: this.item.bottom,
          left: this.item.left,
        };
        bounds = this.scaleBox(bounds, this.slow ? [rotated[0] / this.stageRatio, rotated[1] / this.stageRatio] : [rotated[0], rotated[1]]);
        bounds = this.checkBounds(bounds, { x: this.mode.x, y: this.mode.y });
        if (this.centerScale) {
          let scaleMode = { x: this.mode.x === "right" ? "left" : "right", y: this.mode.y === "bottom" ? "top" : "bottom" };
          bounds = this.scaleBox(bounds, this.slow ? [-rotated[0] / this.stageRatio, -rotated[1] / this.stageRatio] : [-rotated[0], -rotated[1]], scaleMode);
          bounds = this.checkBounds(bounds, scaleMode);
        }
        this.item = bounds;
        this.setCropThrottle();
      }
    },
    scaleBox(bounds, delta, scaleMode = { x: this.mode.x, y: this.mode.y }) {
      delta[1] = delta[0] * (this.appInfo.item.height / this.appInfo.item.width); //lock aspect ratio
      if (scaleMode.x == "right") {
        bounds.right = bounds.right - delta[0];
        if (scaleMode.y == "bottom") {
          bounds.bottom = bounds.bottom - delta[1];
        } else if (scaleMode.y == "top") {
          bounds.top = bounds.top - delta[1];
        }
      } else if (scaleMode.x == "left") {
        bounds.left = bounds.left + delta[0];
        if (scaleMode.y == "bottom") {
          bounds.bottom = bounds.bottom + delta[1];
        } else if (scaleMode.y == "top") {
          bounds.top = bounds.top + delta[1];
        }
      }

      return bounds;
    },
    checkBounds(bounds, scaleMode) {
      let correction = [0, 0];
      if (bounds.left > this.frame.left) {
        correction[0] = this.frame.left - bounds.left;
      } else if (bounds.right > this.frame.right) {
        correction[0] = -(this.frame.right - bounds.right);
      }
      if (bounds.top > this.frame.top) {
        correction[1] = this.frame.top - bounds.top;
      } else if (bounds.bottom > this.frame.bottom) {
        correction[1] = -(this.frame.bottom - bounds.bottom);
      }
      if (!scaleMode) {
        bounds = {
          top: bounds.top + correction[1],
          right: bounds.right - correction[0],
          bottom: bounds.bottom - correction[1],
          left: bounds.left + correction[0],
        };
      } else {
        if (Math.abs(correction[1]) > Math.abs(correction[0])) {
          correction[0] = correction[1] / (this.appInfo.item.height / this.appInfo.item.width);
          if ((scaleMode.x == "right" && scaleMode.y == "top") || (scaleMode.x == "left" && scaleMode.y == "bottom")) {
            correction[0] = -correction[0];
          }
        }
        bounds = this.scaleBox(bounds, correction, scaleMode);
      }
      return bounds;
    },

    handleKeydown(e) {
      if (e.key == "Control") {
        this.slow = true;
      }
      if (e.key == "Shift") {
        this.centerScale = true;
      }
    },
    handleKeyup(e) {
      if (e.key == "Control") {
        this.slow = false;
      }
      if (e.key == "Shift") {
        this.centerScale = false;
      }
    },
    async setupStageObs(resizeStage = true) {
      let obsItem = (await obs.call("GetSceneItemTransform", this.obsTarget)).sceneItemTransform;
      const ALIGNCENTER = 0,
        ALIGNLEFT = 1,
        ALIGNRIGHT = 2,
        ALIGNTOP = 4,
        ALIGNBOTTOM = 8;

      if (resizeStage) {
        await this.resizeStageObs();
      }
      obsItem.scaleX = Math.abs(obsItem.scaleX);
      obsItem.scaleY = Math.abs(obsItem.scaleY);
      let crop = { bottom: obsItem.cropBottom * obsItem.scaleY, left: obsItem.cropLeft * obsItem.scaleX, right: obsItem.cropRight * obsItem.scaleX, top: obsItem.cropTop * obsItem.scaleY };

      this.appInfo.frame = {
        width: obsItem.width - crop.left - crop.right,
        height: obsItem.height - crop.top - crop.bottom,
        canvasRotate: obsItem.rotation,
        rotateZ: obsItem.rotation,
        alignX: "left",
        alignY: "top",
        flipHorz: false,
        flipVert: false,
      };
      //Horizontal Flip
      if (obsItem.width < 0) {
        this.appInfo.frame.flipHorz = true;
        crop = { bottom: crop.bottom, left: crop.right, right: crop.left, top: crop.top };
        this.appInfo.frame.width = Math.abs(obsItem.width) - crop.left - crop.right;
        if (obsItem.alignment % 4 == ALIGNRIGHT) {
          obsItem.alignment--;
        } else {
          obsItem.alignment++;
        }
      }
      let alignmentPosition = { x: 0, y: 0 };
      if (obsItem.alignment < ALIGNTOP) {
        alignmentPosition.y = this.appInfo.frame.height / 2;
        this.appInfo.frame.alignY = "center";
      } else if (obsItem.alignment >= ALIGNBOTTOM) {
        alignmentPosition.y = this.appInfo.frame.height;
        this.appInfo.frame.alignY = "bottom";
      }
      if (obsItem.alignment % 4 == ALIGNCENTER) {
        alignmentPosition.x = this.appInfo.frame.width / 2;
        this.appInfo.frame.alignX = "center";
      } else if (obsItem.alignment % 4 == ALIGNRIGHT) {
        alignmentPosition.x = this.appInfo.frame.width;
        this.appInfo.frame.alignX = "right";
      }
      this.appInfo.frame.top = obsItem.positionY - alignmentPosition.y;
      this.appInfo.frame.right = this.appInfo.stage.width - (obsItem.positionX - alignmentPosition.x + this.appInfo.frame.width);
      this.appInfo.frame.bottom = this.appInfo.stage.height - (obsItem.positionY - alignmentPosition.y + this.appInfo.frame.height);
      this.appInfo.frame.left = obsItem.positionX - alignmentPosition.x;

      this.appInfo.item = {
        width: Math.abs(obsItem.width),
        height: obsItem.height,
        nativeWidth: obsItem.sourceWidth,
        nativeHeight: obsItem.sourceHeight,
      };
      this.appInfo.item.top = this.appInfo.frame.top - crop.top;
      this.appInfo.item.right = this.appInfo.frame.right - crop.right;
      this.appInfo.item.bottom = this.appInfo.frame.bottom - crop.bottom;
      this.appInfo.item.left = this.appInfo.frame.left - crop.left;

      this.item = {
        top: this.appInfo.item.top / this.stageRatio,
        right: this.appInfo.item.right / this.stageRatio,
        bottom: this.appInfo.item.bottom / this.stageRatio,
        left: this.appInfo.item.left / this.stageRatio,
      };
    },

    async resizeStageObs() {
      let videosettings = await obs.call("GetVideoSettings");
      this.appInfo.stage.width = videosettings.baseWidth;
      this.appInfo.stage.height = videosettings.baseHeight;
    },
    clearStage() {
      this.appInfo.frame = {};
      this.appInfo.item = {};
      this.targetItem = {};
      this.item = {};
    },
    rotate(x, y, xm, ym, a) {
      var cos = Math.cos,
        sin = Math.sin,
        a = (a * Math.PI) / 180,
        xr = (x - xm) * cos(a) - (y - ym) * sin(a) + xm,
        yr = (x - xm) * sin(a) + (y - ym) * cos(a) + ym;

      return [xr, yr];
    },

    setCropObs() {
      let itemWidth = this.appInfo.stage.width - (this.item.left + this.item.right) * this.stageRatio;
      let itemHeight = itemWidth * (this.appInfo.item.height / this.appInfo.item.width);
      let sceneItemTransform = {};

      sceneItemTransform.scaleX = itemWidth / this.appInfo.item.nativeWidth;
      sceneItemTransform.scaleY = itemHeight / this.appInfo.item.nativeHeight;

      sceneItemTransform.cropTop = Math.round(Math.max(0, ((this.frame.top - this.item.top) / sceneItemTransform.scaleY) * this.stageRatio));
      sceneItemTransform.cropRight = Math.round(Math.max(0, ((this.frame.right - this.item.right) / sceneItemTransform.scaleX) * this.stageRatio));
      sceneItemTransform.cropBottom = Math.round(Math.max(0, -(this.appInfo.frame.height + sceneItemTransform.cropTop * sceneItemTransform.scaleY - itemHeight) / sceneItemTransform.scaleY));
      sceneItemTransform.cropLeft = Math.round(Math.max(0, -(this.appInfo.frame.width + sceneItemTransform.cropRight * sceneItemTransform.scaleX - itemWidth) / sceneItemTransform.scaleX));

      if (this.appInfo.frame.flipHorz) {
        sceneItemTransform.scaleX = -sceneItemTransform.scaleX;
        let tempRight = sceneItemTransform.cropRight;
        sceneItemTransform.cropRight = sceneItemTransform.cropLeft;
        sceneItemTransform.cropLeft = tempRight;
      }
      console.log(sceneItemTransform);
      this.lastCropUpdate = Date.now();
      obs.call("SetSceneItemTransform", {
        ...this.obsTarget,
        sceneItemTransform: sceneItemTransform,
      });
    },
    setCropThrottle: _.throttle(function () {
      this.setCropObs();
    }, 30),
    resizeTo(percent) {
      percent = percent / 100;
      percent = Math.max(app.appInfo.frame.width / app.appInfo.item.nativeWidth, app.appInfo.frame.height / app.appInfo.item.nativeHeight, percent);
      let bounds = {
        top: this.item.top,
        right: this.item.right,
        bottom: this.item.bottom,
        left: this.item.left,
      };
      bounds = this.setScale(bounds, percent, { x: "right", y: "bottom" });
      this.item = bounds;
      this.setCropThrottle();
    },
    setScale(bounds, percent, scaleMode) {
      let itemWidth = this.stage.width - bounds.right - bounds.left;
      let itemHeight = this.stage.height - bounds.top - bounds.bottom;
      let newItemWidth = (this.appInfo.item.nativeWidth * percent) / this.stageRatio;
      let newItemHeight = (newItemWidth * this.appInfo.item.height) / this.appInfo.item.width;
      let delta = [(newItemWidth - itemWidth) / 2, (newItemHeight - itemHeight) / 2];

      bounds = this.scaleBox(bounds, delta, scaleMode);
      bounds = this.scaleBox(bounds, [-delta[0], delta[1]], { x: "left", y: "top" });
      bounds = this.checkBounds(bounds);

      return bounds;
    },

    async getAllItemsobs() {
      let scenes = (await obs.call("GetSceneList")).scenes.reverse();
      let itemList = await Promise.all(
        scenes.map(async (scene) => {
          let sceneInfo = scene;
          let sceneItems = (await obs.call("GetSceneItemList", { sceneName: sceneInfo.sceneName })).sceneItems.reverse();
          sceneInfo.items = [];
          for (const item of sceneItems) {
            item.sceneName = sceneInfo.sceneName;
            sceneInfo.items.push(item);
            if (item.isGroup) {
              let itemChildren = (await obs.call("GetGroupSceneItemList", { sceneName: item.sourceName })).sceneItems.reverse();
              sceneInfo.items = [
                ...sceneInfo.items,
                ...itemChildren.map((child) => {
                  child.sceneName = item.sourceName;
                  child.inGroup = true;
                  return child;
                }),
              ];
            }
          }
          return sceneInfo;
        })
      );
      this.itemList = itemList;
    },
    init() {
      window.addEventListener("mouseup", () => (this.mode = false));
      window.addEventListener("mousemove", this.handleMouseMove);
      window.addEventListener("keydown", this.handleKeydown);
      window.addEventListener("keyup", this.handleKeyup);

      obs.on("SceneItemSelected", async (sceneItem) => {
        this.targetItem = {
          sceneItemId: sceneItem.sceneItemId,
          sceneName: sceneItem.sceneName,
        };
      });
      obs.on("SceneItemTransformChanged", (sceneItem) => {
        if (sceneItem.sceneItemId === this.targetItem.sceneItemId && sceneItem.sceneName === this.targetItem.sceneName) {
          if (this.lastCropUpdate + 100 < Date.now()) {
            this.setupStageObs(false);
          }
        }
      });
      this.getAllItemsobs();
    },
    async socketLogin() {
      if (this.socketserver && this.socketpassword) {
        try {
          await obs.connect(this.socketserver, this.socketpassword, { eventSubscriptions: OBSWebSocket.EventSubscription.All | OBSWebSocket.EventSubscription.SceneItemTransformChanged });
          this.socketConnected = true;
          localStorage.setItem("nifty-obswebsocket-server", this.socketserver);
          localStorage.setItem("nifty-obswebsocket-password", this.socketpassword);
          this.init();
        } catch (error) {
          this.loginError = `Failed to connect' ${error.code} ${error.message}`;
        }
      }
    },
  },
  mounted() {
    this.socketserver = localStorage.getItem("nifty-obswebsocket-server") || this.socketserver;
    this.socketpassword = localStorage.getItem("nifty-obswebsocket-password") || this.socketpassword;
    this.socketLogin();
  },
});
