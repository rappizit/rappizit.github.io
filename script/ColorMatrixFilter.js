
/**
 * ColorMatrixFilter(matrix:Array = null)
 * http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/filters/ColorMatrixFilter.html
 */
var ColorMatrixFilter = function(matrix) {

    this.apply = function(srcBitmap, dstBitmap, srcRect, dstPoint) {
        //redResult   = (a[0]  * srcR) + (a[1]  * srcG) + (a[2]  * srcB) + (a[3]  * srcA) + a[4]
        //greenResult = (a[5]  * srcR) + (a[6]  * srcG) + (a[7]  * srcB) + (a[8]  * srcA) + a[9]
        //blueResult  = (a[10] * srcR) + (a[11] * srcG) + (a[12] * srcB) + (a[13] * srcA) + a[14]
        //alphaResult = (a[15] * srcR) + (a[16] * srcG) + (a[17] * srcB) + (a[18] * srcA) + a[19]

        var dstRect = dstBitmap.calDstRect(srcRect, dstPoint);
        var x0 = dstRect.l;
        var y0 = dstRect.t;
        var x1 = dstRect.r;
        var y1 = dstRect.b;
        if (x0 >= x1 || y0 >= y1) return;
        var dstStride = dstBitmap.width * 4;
        var dst = dstBitmap.data;

        var src = srcBitmap.data;
        var m = matrix;

        for (var y = y0; y < y1; ++y) {
            var dstIndex = y * dstStride + x0 * 4;
            var srcIndex = (y - dstPoint.y + srcRect.t) * srcBitmap.width * 4 + (srcRect.l + x0 - dstPoint.x) * 4;
            for (var x = x0; x < x1; ++x) {
                var r = src[srcIndex];
                var g = src[srcIndex + 1];
                var b = src[srcIndex + 2];
                var a = src[srcIndex + 3];
                dst[dstIndex] = m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4];
                dst[dstIndex + 1] = m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9];
                dst[dstIndex + 2] = m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14];
                dst[dstIndex + 3] = m[15] * r + m[16] * g + m[17] * b + m[18] * a + m[19];
                dstIndex += 4;
                srcIndex += 4;
            }
        }
        
    }
}