/*
 * http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/display/BitmapData.html
 */

/*
 * a helper function, usage:
    var img = new Image();
    img.onload = function() {
        var srcImageData = convertImageToImageData(this);
    }
    img.src = 'xxx.jpg';
 */
function convertImageToImageData(image) {
	var canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function  BitmapDataChannel() {
}

BitmapDataChannel.ALPHA = 8;
BitmapDataChannel.BLUE = 4;
BitmapDataChannel.GREEN = 2;
BitmapDataChannel.RED = 1;
BitmapDataChannel.getIndex = function(channel) {
    switch(channel) {
        case BitmapDataChannel.ALPHA:
            return 3;
        case BitmapDataChannel.BLUE:
            return 2;
        case BitmapDataChannel.GREEN:
            return 1;
        case BitmapDataChannel.RED:
            return 0;
        default:
            return 0;
    }
}
BitmapDataChannel.hasChannel = function(channels, channel) {
    return (channels & channel) == channel;
}

ImageData.clamp = function(x, a, b) {
    if (x <= a) return a;
    if (x >= b) return b;
    return x;
}

ImageData.wrap = function(x, s) {
    x %= s;
    return x >= 0 ? x : x + s;
}

ImageData.ORIGIN = {x:0, y:0};

ImageData.prototype.getRect = function() {
    return this.rect ? this.rect : this.rect = {l:0, t:0, r:this.width, b:this.height};
}

ImageData.prototype.calDstRect = function(srcRect, dstPoint) {
    var left = ImageData.clamp(dstPoint.x, 0, this.width);
    var top = ImageData.clamp(dstPoint.y, 0, this.height);
    var right = ImageData.clamp(srcRect.r - srcRect.l + dstPoint.x, 0, this.width);
    var bottom = ImageData.clamp(srcRect.b - srcRect.t + dstPoint.y, 0, this.height);
    return {l: left, t: top, r: right, b: bottom};
}

/*
 * public function applyFilter(sourceBitmapData:BitmapData, sourceRect:Rectangle, destPoint:Point, filter:BitmapFilter):void
 *
 * Notice: if this == srcBitmap && srcRect != srcBitmap.rect && dstPoint != (0, 0), it can failed.
 */
ImageData.prototype.applyFilter = function(srcBitmap, srcRect, dstPoint, filter) {
    srcRect = srcRect || srcBitmap.getRect();
    dstPoint = dstPoint || ImageData.ORIGIN;
    filter.apply(srcBitmap, this, srcRect, dstPoint);
}

/*
 * public function copyPixels(sourceBitmapData:BitmapData, sourceRect:Rectangle, destPoint:Point, alphaBitmapData:BitmapData = null, alphaPoint:Point = null, mergeAlpha:Boolean = false):void
 */
ImageData.prototype.copyPixels = function(srcBitmap, srcRect, dstPoint) {
    srcRect = srcRect || srcBitmap.getRect();
    dstPoint = dstPoint || ImageData.ORIGIN;
    if (srcRect.l >= srcRect.r || srcRect.t >= srcRect.b) return;
    var dstRect = this.calDstRect(srcRect, dstPoint);
    var x0 = dstRect.l;
    var y0 = dstRect.t;
    var x1 = dstRect.r;
    var y1 = dstRect.b;
    var dst = this.data;
    var dy = 1;
    if (isNaN(x0) || isNaN(x1) || isNaN(y0) || isNaN(y1)) {
        alert("Error - ImageData.copyPixels: x0=" + x0 + " x1=" + x1 + " dx=" + dx + " y0=" + y0 + " y1=" + y1 + " dy=" + dy);
        return;
    }
    if (x0 >= x1 || y0 >= y1) return;
    var src = srcBitmap.data;
    if (src == dst && dstPoint.y > srcRect.t) {
        dy = -dy;
        y0 = dstRect.b - 1;
        y1 = dstRect.t - 1;
    }

    for (var y = y0; y != y1; y += dy) {
        var dstIndex = (y * this.width + x0) * 4;
        var srcIndex = ( (y - dstPoint.y + srcRect.t) * srcBitmap.width + (srcRect.l + x0 - dstPoint.x) ) * 4;
        var srcArray = new Uint32Array(src.buffer, srcIndex, x1 - x0);
        var dstArray = new Uint32Array(dst.buffer, dstIndex, x1 - x0);
        dstArray.set(srcArray);
    }
}

/*
 * fillRect(rect:Rectangle, color:uint):void
 */
ImageData.prototype.fillRect = function(rect, color) {
    rect = rect || this.getRect();
    color = color || 0;
    if (isNaN(rect.l) || isNaN(rect.r) || isNaN(rect.t) || isNaN(rect.b)) {
        alert("Error - ImageData.fillRect: rect.l=" + rect.l + " rect.r=" + rect.r + " rect.t=" + rect.t + " rect.b=" + rect.b);
        return;
    }
    rect = this.calDstRect(rect, ImageData.ORIGIN);
    if (rect.l >= rect.r || rect.t >= rect.b) return;

    var W = rect.r - rect.l;
    var H = rect.b - rect.t;
    var srcArray = new Uint32Array(this.data.buffer, 0, W);
    for (var i = 0; i < W; ++i) {
        srcArray[i] = 0xFF000000;
    }
    for (var y = 1; y < H; ++y) {
        var dstArray = new Uint32Array(this.data.buffer, (this.width * y + rect.l) * 4, W);
        dstArray.set(srcArray);
    }
}

var SimplexArray = [];

/*
 * public function perlinNoise(baseX:Number, baseY:Number, numOctaves:uint, randomSeed:int, stitch:Boolean, fractalNoise:Boolean, 
 *      channelOptions:uint = 7, grayScale:Boolean = false, offsets:Array = null, gain:Number = 0.5, lacunaity:Number = 2):void
 */
ImageData.prototype.perlinNoise = function(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsets, gain, lacunaity) {
    SimplexArray = SimplexArray.length > 0 ?  SimplexArray : [new SimplexNoise(), new SimplexNoise() , new SimplexNoise(), new SimplexNoise(), ];
    var invBaseX = 1.0 / baseX;
    var invBaseY = 1.0 / baseY;
    if (numOctaves < 1) numOctaves = 1;
    if (numOctaves > 8) numOctaves = 8;
    channelOptions = channelOptions || 7;
    grayScale = grayScale || false;
    gain = gain || 0.5;
    lacunaity = lacunaity || 2;
    var scaledOffsets  = [];
    for (var i = 0; i < numOctaves; ++i) {
        scaledOffsets[i] = (offsets && i < offsets.length && offsets[i]) ? 
			{x:offsets[i].x * invBaseX, y:offsets[i].y * invBaseY} : 
			ImageData.ORIGIN;
    }

    var PI2 = Math.PI * 2;
    var InvPI2 = 1 / PI2;
    var noiseSumMax = [0];
    var scalednoiseSumMax = [0];
	for (var i = 1, a = 1; i <= numOctaves; ++i) {
		noiseSumMax[i] = noiseSumMax[i - 1] + a;
		scalednoiseSumMax[i] = (fractalNoise ? 127 : 255) / noiseSumMax[i];
		a *= gain;
	}
	
    var turbulence2D = fractalNoise || stitch ? null : function(x, y) {
            var a = 1.0, f = 1.0, s = 0;
            for (var i = 0; i < numOctaves; ++i) {
                s += a * Math.abs(simplex.noise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y)));
                a *= 0.5;
                f *= 2.0;
            }
            return s * scalednoiseSumMax[numOctaves];
        }

    var fbm2D = !fractalNoise || stitch ? null : function(x, y) {
			var a = 1.0, f = 1.0, s = noiseSumMax[numOctaves];
			for (var i = 0; i < numOctaves; ++i) {
				s += a * simplex.noise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y));
				a *= gain;
				f *= lacunaity;
			}
			return s * scalednoiseSumMax[numOctaves];
		}

    var tileableNoise2D = !stitch ? null : function(x, y, w, h) {
		    /*
		    return (simplex.noise2D(x,     y)     * (w - x) * (h - y) +
		            simplex.noise2D(x - w, y)     *      x  * (h - y) +
		            simplex.noise2D(x,     y - h) * (w - x) *      y  +
		            simplex.noise2D(x - w, y - h) *      x  *      y) / (w * h);
		    */
		    x /= w;
		    y /= h;
		    w *= InvPI2;
		    h *= InvPI2;
		    return simplex.noise4D(
		        Math.cos(x * PI2) * w, 
		        Math.cos(y * PI2) * h,
		        Math.sin(x * PI2) * w,
		        Math.sin(y * PI2) * h);
		}

    var tileableTurbulence2D = fractalNoise || !stitch ? null : function(x, y, w, h) {
            var a = 1.0, f = 1.0, s = 0;
            for (var i = 0; i < numOctaves; ++i) {
                s += a * Math.abs(tileableNoise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y), f * w, f * h));
                a *= 0.5;
                f *= 2.0;
            }
            return s * scalednoiseSumMax[numOctaves];
        }

    var tileableFbm2D = !fractalNoise || !stitch ? null : function(x, y, w, h) {
            var a = 1.0, f = 1.0, s = noiseSumMax[numOctaves];
            for (var i = 0; i < numOctaves; ++i) {
                s += a * tileableNoise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y), f * w, f * h);
                a *= gain;
                f *= lacunaity;
            }
            return s * scalednoiseSumMax[numOctaves];
        }


    var data = this.data;
    var H = this.height;
    var W = this.width;
    var colorComponent = [
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.RED), 
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.GREEN), 
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.BLUE), 
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.ALPHA), 
        ];
    var hasColor = colorComponent[0] || colorComponent[1] || colorComponent[2] || colorComponent[3];
    var tmpGray = hasColor ? grayScale : true;
    if (tmpGray) {
        colorComponent = [true, false, false, false];
    }
/*
    var SimplexArray = tmpGray ? [new SimplexNoise()] : [
            colorComponent[0] ? new SimplexNoise() : null, 
            colorComponent[1] ? new SimplexNoise() : null,
            colorComponent[2] ? new SimplexNoise() : null,
            colorComponent[3] ? new SimplexNoise() : null,
        ];
*/
    //offsets = offsets ? offsets : [{x:0, y:0}];
    //var OffsetX = offsets[0].x * invBaseX;
    //var OffsetY = offsets[0].y * invBaseY;
    var OffsetX = 0;
    var OffsetY = 0;

    this.fillRect(null, 0xFF000000);

    if (!stitch) {
        if (fractalNoise) {
            for (var comp = 0; comp < 4; ++comp) {
                if (!colorComponent[comp]) continue;
                var simplex = SimplexArray[comp];
                for (var y = 0, idx = comp, y2 = OffsetY; y < H; ++y, y2 += invBaseY) {
                    for (var x = 0, x2 = OffsetX; x < W; ++x, x2 += invBaseX) {
                        data[idx] = fbm2D(x2, y2);
                        idx += 4;
                    }
                }
            }

        } else {
            for (var comp = 0; comp < 4; ++comp) {
                if (!colorComponent[comp]) continue;
                var simplex = SimplexArray[comp];
                for (var y = 0, idx = comp, y2 = OffsetY; y < H; ++y, y2 += invBaseY) {
                    for (var x = 0, x2 = OffsetX; x < W; ++x, x2 += invBaseX) {
                        data[idx] = turbulence2D(x2, y2);
                        idx += 4;
                    }
                }
            }
        }
    } else {
    	var w = W * invBaseX;
    	var h = H * invBaseY;
        if (fractalNoise) {
            for (var comp = 0; comp < 4; ++comp) {
                if (!colorComponent[comp]) continue;
                var simplex = SimplexArray[comp];
                for (var y = 0, idx = comp, y2 = OffsetY; y < H; ++y, y2 += invBaseY) {
                    for (var x = 0, x2 = OffsetX; x < W; ++x, x2 += invBaseX) {
                        data[idx] = tileableFbm2D(x2, y2, w, h);
                        idx += 4;
                    }
                }
            }

        } else {
            for (var comp = 0; comp < 4; ++comp) {
                if (!colorComponent[comp]) continue;
                var simplex = SimplexArray[comp];
                for (var y = 0, idx = comp, y2 = OffsetY; y < H; ++y, y2 += invBaseY) {
                    for (var x = 0, x2 = OffsetX; x < W; ++x, x2 += invBaseX) {
                        data[idx] = tileableTurbulence2D(x2, y2, w, h);
                        idx += 4;
                    }
                }
            }
        }
    }

     for (var comp = 1; comp < 4; ++comp) {
        if (colorComponent[comp]) continue;
        if (comp < 3) {
            if (tmpGray) {
                for (var y = 0, idx = 0; y < H; ++y) {
                    for (var x = 0; x < W; ++x) {
                        data[idx + comp] = data[idx];
                        idx += 4;
                    }
                }
            }
        }
    }

}

/*
 * public function scroll(x:int, y:int):void
 */
ImageData.prototype.scroll = function(x, y) {
    this.copyPixels(this, null, {x:x, y:y});
}