class CanvasOverlay {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.markers = [];
        this.liveCallbacks = [];
    }
    
    addMarker(x, y, color) {
        this.markers.push([x, y, color]);
    }
    
    addLiveCallback(cb) {
        this.liveCallbacks.push(cb);
    }
    
    clear() {
        this.markers = [];
        this.children = [];
    }
    
    _drawMarker(m, eye) {
        var ratio = this.canvas.width/this.canvas.height;
        var x = this.canvas.width/2 + this.canvas.height/2 * ns.number(ns.sub(m[0], eye.offsetX)) / eye.scale;
        var y = this.canvas.height/2 - this.canvas.height/2 * ns.number(ns.sub(m[1], eye.offsetY)) / eye.scale;

        var w = 10;
        
        this.ctx.strokeStyle = m[2];
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - w, y - w, 2*w, 2*w);
        //console.log(x - w, y - w, 2*w, 2*w, 'aaa', m[0], eye.offsetX, eye.scale);
        
    }
    
    draw(eye) {
        if (this.liveCallbacks.length > 0) {
            if (!this.liveOverlay) {
                this.liveOverlay = new CanvasOverlay(this.canvas);
            }
            this.liveOverlay.clear();
            this.liveCallbacks.forEach(cb => cb(this.liveOverlay));
            this.liveOverlay.draw(eye);
        }
        for (var i = 0; i < this.markers.length; i++) {
            this._drawMarker(this.markers[i], eye);
        }
    }
}

M.CanvasOverlay = CanvasOverlay;