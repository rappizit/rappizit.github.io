

function DisplacementMapFilterMode() {
}
DisplacementMapFilterMode.CLAMP = "clamp";
DisplacementMapFilterMode.COLOR = "color";
DisplacementMapFilterMode.IGNORE = "ignore";
DisplacementMapFilterMode.WRAP = "wrap";

/**
 * DisplacementMapFilter(mapBitmap:ImageData = null, mapPoint:Point = null, componentX:uint = 0, componentY:uint = 0, 
 *      scaleX:Number = 0.0, scaleY:Number = 0.0, mode:String = "wrap", color:uint = 0, alpha:Number = 0.0)
 *
 * http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/filters/DisplacementMapFilter.html
 */
var DisplacementMapFilter = function(mapBitmap, mapPoint, componentX, componentY, scaleX, scaleY, mode, color, alpha) {
    mapPoint = mapPoint || {x:0, y:0};
    scaleX = scaleX ? scaleX / 256.0 : 0;
    scaleY = scaleY ? scaleY / 256.0 : 0;
    mode = mode || DisplacementMapFilterMode.WRAP;
    color = color || 0;
    alpha = alpha || 0.0;

    this.apply = function(srcBitmap, dstBitmap, srcRect, dstPoint) {
        //componentX(x, y)=mapBitmap(x - mapPoint.x ,y - mapPoint.y).componentX
        //dstPixel[x, y] = srcPixel[x + ((componentX(x, y) - 128) * scaleX) / 256, y + ((componentY(x, y) - 128) *scaleY) / 256)]

        var clamp = ImageData.clamp;
        var wrap = ImageData.wrap;
        var mapW = mapBitmap.width;
        var mapH = mapBitmap.height;
        var map = mapBitmap.data;
        var mapStride = mapW * 4;
        var srcW = srcBitmap.width;
        var srcH = srcBitmap.height;
        var src = srcBitmap.data;
        var srcStride = srcW * 4;
        var dstW = dstBitmap.width;
        var dstH = dstBitmap.height;
        var dst = dstBitmap.data;

        var mapPointX = mapPoint.x;
        var mapPointY = mapPoint.y;
        var indexOffsetX = componentX ? BitmapDataChannel.getIndex(componentX) : 0;
        var indexOffsetY = componentY ? BitmapDataChannel.getIndex(componentY) : 0;
        var deltaComponentXY = indexOffsetY - indexOffsetX;

        if (mode == DisplacementMapFilterMode.CLAMP) {
            for (var y = 0, dstIndex = 0; y < dstH; ++y) {
                var mapY = clamp(y - mapPointY, 0, mapH);
                var mapIndexBaseX = mapY * mapStride + indexOffsetX;;
                for (var x = 0; x < dstW; ++x) {
                    var mapIndexX = clamp(x - mapPointX, 0, mapW) * 4 + mapIndexBaseX;
                    var mapIndexY = mapIndexX + deltaComponentXY;
                    var srcX = Math.round((map[mapIndexX] - 128) * scaleX) + x;
                    var srcY = Math.round((map[mapIndexY] - 128) * scaleY) + y;
                    //use the mode
                    srcX = clamp(srcX, 0, srcW - 1);
                    srcY = clamp(srcY, 0, srcH - 1);
                    
                    var srcIndex = srcY * srcStride + srcX * 4;
                    dst[dstIndex] = src[srcIndex];
                    dst[dstIndex + 1] = src[srcIndex + 1];
                    dst[dstIndex + 2] = src[srcIndex + 2];
                    dst[dstIndex + 3] = src[srcIndex + 3];
                    dstIndex += 4;
                }
            }

        } else if (mode == DisplacementMapFilterMode.COLOR) {
            var blue = color & 255;
            var green = (color >> 8) & 255;
            var red = (color >> 16) & 255;
            var alpha = alpha * 255;
            
            for (var y = 0, dstIndex = 0; y < dstH; ++y) {
                var mapY = clamp(y - mapPointY, 0, mapH);
                var mapIndexBaseX = mapY * mapStride + indexOffsetX;;
                for (var x = 0; x < dstW; ++x) {
                    var mapIndexX = clamp(x - mapPointX, 0, mapW) * 4 + mapIndexBaseX;
                    var mapIndexY = mapIndexX + deltaComponentXY;
                    var srcX = Math.round((map[mapIndexX] - 128) * scaleX) + x;
                    var srcY = Math.round((map[mapIndexY] - 128) * scaleY) + y;
                    //use the mode
                    if (srcX < 0 || srcX >= srcW || srcY < 0 || srcY >= srcH) {
                        dst[dstIndex] = red;
                        dst[dstIndex + 1] = green;
                        dst[dstIndex + 2] = blue;
                        dst[dstIndex + 3] = alpha;
                        dstIndex += 4;
                        continue;
                    }

                    var srcIndex = srcY * srcStride + srcX * 4;
                    dst[dstIndex] = src[srcIndex];
                    dst[dstIndex + 1] = src[srcIndex + 1];
                    dst[dstIndex + 2] = src[srcIndex + 2];
                    dst[dstIndex + 3] = src[srcIndex + 3];
                    dstIndex += 4;
                }
            }

        } else if (mode == DisplacementMapFilterMode.IGNORE) {
            for (var y = 0, dstIndex = 0; y < dstH; ++y) {
                var mapY = clamp(y - mapPointY, 0, mapH);
                var mapIndexBaseX = mapY * mapStride + indexOffsetX;;
                for (var x = 0; x < dstW; ++x) {
                    var mapIndexX = clamp(x - mapPointX, 0, mapW) * 4 + mapIndexBaseX;
                    var mapIndexY = mapIndexX + deltaComponentXY;
                    var srcX = Math.round((map[mapIndexX] - 128) * scaleX) + x;
                    var srcY = Math.round((map[mapIndexY] - 128) * scaleY) + y;
                    //use the mode
                    if (srcX < 0 || srcX >= srcW || srcY < 0 || srcY >= srcH) {
                        dstIndex += 4;
                        continue;
                    }

                    var srcIndex = srcY * srcStride + srcX * 4;
                    dst[dstIndex] = src[srcIndex];
                    dst[dstIndex + 1] = src[srcIndex + 1];
                    dst[dstIndex + 2] = src[srcIndex + 2];
                    dst[dstIndex + 3] = src[srcIndex + 3];
                    dstIndex += 4;
                }
            }

        } else if (mode == DisplacementMapFilterMode.WRAP) {
            for (var y = 0, dstIndex = 0; y < dstH; ++y) {
                var mapY = clamp(y - mapPointY, 0, mapH);
                var mapIndexBaseX = mapY * mapStride + indexOffsetX;;
                for (var x = 0; x < dstW; ++x) {
                    var mapIndexX = clamp(x - mapPointX, 0, mapW) * 4 + mapIndexBaseX;
                    var mapIndexY = mapIndexX + deltaComponentXY;
                    var srcX = Math.round((map[mapIndexX] - 128) * scaleX) + x;
                    var srcY = Math.round((map[mapIndexY] - 128) * scaleY) + y;
                    //use the mode
                    srcX = wrap(srcX, srcW);
                    srcY = wrap(srcY, srcH);
                    
                    var srcIndex = srcY * srcStride + srcX * 4;
                    dst[dstIndex] = src[srcIndex];
                    dst[dstIndex + 1] = src[srcIndex + 1];
                    dst[dstIndex + 2] = src[srcIndex + 2];
                    dst[dstIndex + 3] = src[srcIndex + 3];
                    dstIndex += 4;
                }
            }

        }
    }
}