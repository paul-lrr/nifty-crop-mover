# Nifty Crop Mover
OBS utility for adjusting the size and position of a scene item without moving its frame

## Introduction
Given an item on the OBS canvas that has been cropped to fit a layout, this utility allows you to move and scale the item without moving its frame. It should work with any type of source (image, video, camera, html, etc.) and accurately represent items rotated in the Z axis (ie. 2D rotation) in 90° increments as well as arbitrary angles.

### Example
Without Nifty Crop Mover | With Nifty Crop Mover
-------------------|--------------
![without-crop-mover](https://user-images.githubusercontent.com/11876694/236348716-dcb98652-c95a-411b-a22f-326bbbfa2b89.gif)|![with-crop-mover](https://user-images.githubusercontent.com/11876694/236348774-6a828a2a-f340-4144-befd-a6a91bea0de3.gif)

## Installation
1. Download or clone this repo to your local computer
2. Open OBS
3. Go to Tools->WebSocket Server Settings and make sure the server is enabled and the password is set
4. Either a) Add the index.html file as a Custom Browser Dock by selecting "Custom Browser Docks..." or launch the index.html file directly
5. Input your WebSocket server address and password. The default server address of `ws://localhost:4455` should work unless you are trying to access an OBS instance on another system


## Usage
To use the extension, simply select an item by clicking on it on the canvas or in the sources list. The extension should display the frame of the selected item in green, with the area of the item that is currently cropped shown in grey. Click and drag anywhere in the grey box to change the item cropping. Click and drag on any of the four corner squares to scale the item (scaling is always proportional). You cannot move or scale the item to be within the frame. The Extension should also take into account if the item has been rotated on the Z axis (2d rotation). 

*Note: Due to how the OBS WebSocket triggers events, it only detects changes in the selected item, so if an item is selected when the utility loads or when you switch scenes you may have to reselect it to have Nifty Crop Mover notice*

### Extra Features
##### Precise Movement
Since the Crop Mover window is smaller then the OBS Canvas, 1px of mouse drag translates into a larger movement of the item on the stage. Hold down the `ctrl` key to switch to 1:1 movement of the item and the mouse (The corner squares will turn grey).

##### Center Origin Scaling
Hold `Shift` to make the source scale from the center instead of the corner (The corner squares will turn black)

##### Set Scale
By typing a number in the percent field at the top of the window, you can manually specify the exact scale you want an item to be. Useful for making sure several items are at the exact same scale. As with scaling using the handles, the item cannot be smaller then its frame. The buttons beside the percent field will scale the item to 100% or scale it down to the size of its frame, respectively. 

##### Zoom In/Out
If you are working with a particularly large item that has been cropped to fit on the canvas, it may extend outside the Nifty Crop Mover window, making it difficult to access the handles. In this case, use the scroll wheel to zoom the representation of the OBS canvas in/out.

##### Oversized items
If you scale an item past its native resolution, it will turn red to indicate that the image quality may be degraded

##### Alternate item Selection
In addition to selecting an item in the main OBS window, you can also manually override the current item by using the drop down menu at the bottom of the extension window. This is useful if you want to adjust the cropping of an item on a different scene without switching to that scene (if you have projected that scene onto a separate monitor, for example).
