function ImageDataScroller(imageData, maxScroll) {
    maxScroll = maxScroll || 5;
    var bmpW = imageData.width;
    var bmpH = imageData.height;
    var sliceDataV = ctx.createImageData(maxScroll, bmpH);
    var sliceDataH = ctx.createImageData(bmpW, maxScroll);
    var sliceDataCorner = ctx.createImageData(maxScroll, maxScroll);
    
    this.getImageData = function() {
        return imageData;
    }

    this.scroll = function(scrollX, scrollY) {
        scrollX = ImageData.clamp(scrollX, -maxScroll, maxScroll);
        scrollY = ImageData.clamp(scrollY, -maxScroll, maxScroll);

        var cutRectV = {l:bmpW - scrollX, r:bmpW, t:0, b:bmpH - scrollY};
        var pasteRectV = {l:0, r:Math.abs(scrollX), t:0, b:bmpH - Math.abs(scrollY)};
        var pastePointV = {x:0, y:scrollY};
        var cutRectH = {l:0, r:bmpW-scrollX, t:bmpH - scrollY, b:bmpH};
        var pasteRectH = {l:0, r:bmpW, t:0, b:Math.abs(scrollY)};
        var pastePointH = {x:scrollX, y:0};        
        var cutRectCorner = {l:bmpW - scrollX, r:bmpW, t:bmpH - scrollY, b:bmpH};
        var pasteRectCorner = {l:0, r:Math.abs(scrollX), t:0, b:Math.abs(scrollY)};
        var pastePointCorner = {x:0, y:0};        
        if (scrollX < 0) {
            cutRectV.l = cutRectCorner.l = 0;
            cutRectV.r = cutRectCorner.r = -scrollX;
            pastePointV.x = pastePointCorner.x = bmpW + scrollX;
            cutRectH.l = -scrollX;
            cutRectH.r = bmpW;
            pastePointH.x = 0;
        }
        if (scrollY < 0) {
            cutRectH.t = cutRectCorner.t = 0;
            cutRectH.b = cutRectCorner.b = -scrollY;
            pastePointH.y = pastePointCorner.y = bmpH + scrollY;
            cutRectV.t = -scrollY;
            cutRectV.b = bmpH;
            pastePointV.y = 0;
        }
    
        if (scrollX != 0) {
            sliceDataV.copyPixels(imageData, cutRectV, null);
        }
        if (scrollY != 0) {
            sliceDataH.copyPixels(imageData, cutRectH, null);
        }
        if (scrollX != 0 && scrollY != 0) {
            sliceDataCorner.copyPixels(imageData, cutRectCorner, null);
        }
        imageData.scroll(scrollX, scrollY);
        if (scrollX != 0) {
            imageData.copyPixels(sliceDataV, pasteRectV, pastePointV);
        }
        if (scrollY != 0) {
            imageData.copyPixels(sliceDataH, pasteRectH, pastePointH);
        }
        if (scrollX != 0 && scrollY != 0) {
            imageData.copyPixels(sliceDataCorner, pasteRectCorner, pastePointCorner);
        }
    }

}