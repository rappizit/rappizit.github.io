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

ImageData.prototype.calDstRect = function(srcRect, dstPoint) {
    var left = srcRect.x + dstPoint.x;
    var top = srcRect.y + dstPoint.y;
    var right = ImageData.clamp(left + srcRect.w, 0, this.width);
    var bottom = ImageData.clamp(top + srcRect.h, 0, this.height);
    left = ImageData.clamp(left, 0, this.width);
    top = ImageData.clamp(top, 0, this.height);
    return {x: left, y: top, w: right - left, h: bottom - top};
}

/*
 * public function applyFilter(sourceBitmapData:BitmapData, sourceRect:Rectangle, destPoint:Point, filter:BitmapFilter):void
 */
ImageData.prototype.applyFilter = function(sourceBitmapData, sourceRect, destPoint, filter) {
    sourceRect = sourceRect || {x:0, y:0, w:sourceBitmapData.width, h:sourceBitmapData.height};
    destPoint = destPoint || {x:0, y:0};
    filter.apply(sourceBitmapData, this, sourceRect, destPoint);
}

var SimplexArray =[new SimplexNoise(), new SimplexNoise() , new SimplexNoise(), new SimplexNoise(), ];

/*
 * public function perlinNoise(baseX:Number, baseY:Number, numOctaves:uint, randomSeed:int, stitch:Boolean, fractalNoise:Boolean, 
 *      channelOptions:uint = 7, grayScale:Boolean = false, offsets:Array = null, gain:Number = 0.5, lacunaity:Number = 2):void
 */
ImageData.prototype.perlinNoise = function(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsets, gain, lacunaity) {
    if (numOctaves < 1) numOctaves = 1;
    if (numOctaves > 8) numOctaves = 8;
    channelOptions = channelOptions || 7;
    grayScale = grayScale || false;
    gain = gain || 0.5;
    lacunaity = lacunaity || 2;
    var scaledOffsets  = [];
    for (var i = 0; i < numOctaves; ++i) {
        scaledOffsets[i] = (offsets && i < offsets.length && offsets[i]) ? 
                                        {x:offsets[i].x / baseX, y:offsets[i].y / baseY} : 
                                        {x:0, y:0};
    }

    var PI2 = Math.PI * 2;
    var InvPI2 = 1 / PI2;
    var NoiseSumMax = numOctaves <= 0 ? [] : [
            0.0, 1.0,  2 - 1.0 / 2, 2 - 1.0 / 4,  2 - 1.0 / 8, 
            2 - 1.0 / 16, 2 - 1.0 / 32, 2 - 1.0 / 64, 2 - 1.0 / 128
        ];
    var turbulence2D = numOctaves <= 0 || fractalNoise || stitch ? null : function(x, y, octaves) {
            var a = 1.0, f = 1.0, s = 0;
            for (var i = 0; i < octaves; ++i) {
                s += a * Math.abs(simplex.noise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y)));
                a *= 0.5;
                f *= 2.0;
            }
            return s / NoiseSumMax[octaves];
        }

    var fbm2D = numOctaves <= 0 || !fractalNoise || stitch ? null : function (x, y, octaves) {
			    var a = 1.0, f = 1.0, s = 0, maxS = 0;
			    for (var i = 0; i < octaves; ++i) {
					s += a * simplex.noise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y));
					maxS += a;
					a *= gain;
					f *= lacunaity;
			    }
			    return s / maxS;
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

    var tileableTurbulence2D = numOctaves <= 0 || fractalNoise || !stitch ? null : function(x, y, octaves, w, h) {
                var a = 1.0, f = 1.0, s = 0;
                for (var i = 0; i < octaves; ++i) {
                    s += a * Math.abs(tileableNoise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y), f * w, f * h));
                    a *= 0.5;
                    f *= 2.0;
                }
                return s / NoiseSumMax[octaves];
            }

    var tileableFbm2D = numOctaves <= 0 || !fractalNoise || !stitch ? null : function(x, y, octaves, w, h) {
                var a = 1.0, f = 1.0, s = 0, maxS = 0;
                for (var i = 0; i < octaves; ++i) {
                    s += a * tileableNoise2D(f * (x + scaledOffsets[i].x), f * (y + scaledOffsets[i].y), f * w, f * h);
                    maxS += a;
                    a *= gain;
                    f *= lacunaity;
                }
                return s / maxS;
            }


    var data = this.data;
    var H = this.height;
    var W = this.width;
    var ColorComponent = [
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.RED), 
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.GREEN), 
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.BLUE), 
            BitmapDataChannel.hasChannel(channelOptions, BitmapDataChannel.ALPHA), 
        ];
    var hasColor = ColorComponent[0] || ColorComponent[1] || ColorComponent[2] || ColorComponent[3];
    var tmpGray = hasColor ? grayScale : true;
    if (tmpGray) {
        ColorComponent = [true, false, false, false];
    }
/*
    var SimplexArray = tmpGray ? [new SimplexNoise()] : [
            ColorComponent[0] ? new SimplexNoise() : null, 
            ColorComponent[1] ? new SimplexNoise() : null,
            ColorComponent[2] ? new SimplexNoise() : null,
            ColorComponent[3] ? new SimplexNoise() : null,
        ];
*/
    var BaseX = 256 / baseX;
    var BaseY = 256 / baseY;
    var BaseX_W = BaseX / W;
    var BaseY_H = BaseY / H;
    var Octaves = numOctaves;
    var Gain = gain;
    var Lacunaity = lacunaity;
    offsets = offsets ? offsets : [{x:0, y:0}];
    var OffsetX = 0;//offsets[0].x;
    var OffsetY = 0;//offsets[0].y;

    if (!stitch) {
        if (fractalNoise) {
            for (var comp = 0; comp < 4; ++comp) {
                if (ColorComponent[comp]) {
                    var simplex = SimplexArray[comp];
                    for (var y = 0, idx = comp, y2 = OffsetY; y < H; ++y, y2 += BaseY_H) {
                        for (var x = 0, x2 = OffsetX; x < W; ++x, x2 += BaseX_W) {
                            data[idx] = fbm2D(x2, y2, Octaves) * 128 + 127;
                            idx += 4;
                        }
                    }
                }
            }

        } else {
            for (var comp = 0; comp < 4; ++comp) {
                if (ColorComponent[comp]) {
                    var simplex = SimplexArray[comp];
                    for (var y = 0, idx = comp, y2 = OffsetY; y < H; ++y, y2 += BaseY_H) {
                        for (var x = 0, x2 = OffsetX; x < W; ++x, x2 += BaseX_W) {
                            data[idx] = turbulence2D(x2, y2, Octaves) * 255;
                            idx += 4;
                        }
                    }
                }
            }
        }
    } else {
        if (fractalNoise) {
            for (var comp = 0; comp < 4; ++comp) {
                if (ColorComponent[comp]) {
                    var simplex = SimplexArray[comp];
                    for (var y = 0, idx = comp; y < H; ++y) {
                        var y2 = (y % (H / 2) * BaseY_H * 2 + OffsetY % BaseY + BaseY) % BaseY;
                        var dx = OffsetX % BaseX + BaseX;
                        var halfW = W / 2;
                        var BaseX_W_2 = BaseX_W * 2;
                        for (var x = 0; x < W; ++x) {
                            var x2 = (x % halfW * BaseX_W_2 + dx) % BaseX;
                            data[idx] = tileableFbm2D(x2, y2, Octaves, BaseX, BaseY) * 128 + 127;
                            idx += 4;
                        }
                    }
                }
            }

        } else {
            for (var comp = 0; comp < 4; ++comp) {
                if (ColorComponent[comp]) {
                    var simplex = SimplexArray[comp];
                    for (var y = 0, idx = comp; y < H; ++y) {
                        var y2 = (y % (H / 2) * BaseY_H * 2 + OffsetY % BaseY + BaseY) % BaseY;
                        var dx = OffsetX % BaseX + BaseX;
                        var halfW = W / 2;
                        var BaseX_W_2 = BaseX_W * 2;
                        for (var x = 0; x < W; ++x) {
                            var x2 = (x % halfW * BaseX_W_2 + dx) % BaseX;
                            data[idx] = tileableTurbulence2D(x2, y2, Octaves, BaseX, BaseY) * 255;
                            idx += 4;
                        }
                    }
                }
            }
        }
    }

     for (var comp = 1; comp < 4; ++comp) {
        if (!ColorComponent[comp]) {
                if (comp < 3) {
                        if (tmpGray) {
                            for (var y = 0, idx = 0; y < H; ++y) {
                                for (var x = 0; x < W; ++x) {
                                    data[idx + comp] = data[idx];
                                    idx += 4;
                                }
                            }
                        } else {
                                // comment this section for optimization, cuz' these channels would not be used
                                for (var y = 0, idx = 0; y < H; ++y) {
                                        for (var x = 0; x < W; ++x) {
                                                data[idx + comp] = 0;
                                                idx += 4;
                                        }
                                }
                        }
                } else {
                        for (var y = 0, idx = comp; y < H; ++y) {
                                for (var x = 0; x < W; ++x) {
                                        data[idx] = 255;
                                        idx += 4;
                                }
                        }
                }
        }
    }

}