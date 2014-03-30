/*
 * moveOriginData: false if need optimizaztion, and then use getPasteRectV() and getPasteRectH() to get the changed rect and copy pixels
 */
function PerlinNoiseScroller(imageData, maxScrollX, maxScrollY, moveOriginData, baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsets, gain, lacunaity) {
    if (stitch) {
        alert("stitch==true: us ImageDataScroller instead");
    }
    offsets = offsets || [];
    maxScrollX = maxScrollX || 5;
    maxScrollY = maxScrollY || 5;
    var bmpW = imageData.width;
    var bmpH = imageData.height;
    var sliceDataV = ctx.createImageData(maxScrollX, bmpH);
    var sliceDataH = ctx.createImageData(bmpW, maxScrollY);
    
    var totalScrollX = 0;
    var totalScrollY = 0;
    var pasteRectV;
    var pastePointV;
    var pasteRectH;
    var pastePointH;
    
    var offsetsBak  = [];
    var offsetsTmp  = [];
    for (var i = 0; i < numOctaves; ++i) {
        offsetsBak[i] = (offsets && i < offsets.length && offsets[i]) ? 
            {x:offsets[i].x, y:offsets[i].y} : 
            ImageData.ORIGIN;
        offsetsTmp[i] = ImageData.ORIGIN;
    }
    
    imageData.perlinNoise(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsets, gain, lacunaity);
    sliceDataV.SimplexArray = imageData.SimplexArray;
    sliceDataH.SimplexArray = imageData.SimplexArray;

    
    this.getImageData = function() {
        return imageData;
    }

    this.getPasteRectV = function() {
        return {l:pastePointV.x, r:pastePointV.x + pasteRectV.r - pasteRectV.l, t:pastePointV.y, b:pastePointV.y + pasteRectV.b - pasteRectV.t};
    }
    
    this.getPasteRectH= function() {
        return {l:pastePointH.x, r:pastePointH.x + pasteRectH.r - pasteRectH.l, t:pastePointH.y, b:pastePointH.y + pasteRectH.b - pasteRectH.t};
    }

    this.scroll = function(scrollX, scrollY) {
        scrollX = ImageData.clamp(scrollX, -maxScrollX, maxScrollX);
        scrollY = ImageData.clamp(scrollY, -maxScrollY, maxScrollY);
        totalScrollX += scrollX;
        totalScrollY += scrollY;

        pasteRectV = {l:0, r:Math.abs(scrollX), t:0, b:bmpH - Math.abs(scrollY)};
        pastePointV = {x:0, y:scrollY};
        pasteRectH = {l:0, r:bmpW, t:0, b:Math.abs(scrollY)};
        pastePointH = {x:0, y:0}; 
        if (scrollX < 0) {
            pastePointV.x = bmpW + scrollX;
        }
        if (scrollY < 0) {
            pastePointH.y = bmpH + scrollY;
            pastePointV.y = 0;
        }
    
        if (scrollX != 0) {
            var offsetX = pastePointV.x - totalScrollX;
            var offsetY = pastePointV.y - totalScrollY;
            for (var i = 0; i < numOctaves; ++i) {
                offsetsTmp[i] = {x:offsetX + offsetsBak[i].x, y:offsetY + offsetsBak[i].y};
            }
            sliceDataV.perlinNoise(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsetsTmp, gain, lacunaity);
        }
        if (scrollY != 0) {
            var offsetX = pastePointH.x - totalScrollX;
            var offsetY = pastePointH.y - totalScrollY;
            for (var i = 0; i < numOctaves; ++i) {
                offsetsTmp[i] = {x:offsetX + offsetsBak[i].x, y:offsetY + offsetsBak[i].y};
            }
            sliceDataH.perlinNoise(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsetsTmp, gain, lacunaity);
        }
        if (moveOriginData) {
            imageData.scroll(scrollX, scrollY);
        }
        if (scrollX != 0) {
            imageData.copyPixels(sliceDataV, pasteRectV, pastePointV);
        }
        if (scrollY != 0) {
           imageData.copyPixels(sliceDataH, pasteRectH, pastePointH);
        }
    }

}