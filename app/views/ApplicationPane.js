function ApplicationPane() {
    BaseTemplatedWidget.call(this);
    this.busyCount = 0;
    Pencil.boot();

    this.canvasPool = new CanvasPool(this, 3);
    this.controller = new Controller(this.canvasPool, this);
    this.rasterizer = new Rasterizer(this.controller);

    Pencil.controller = this.controller;
    Pencil.rasterizer = this.rasterizer;

    this.sharedFontEditor.applicationPane = this;

    var thiz = this;

    this.bind("click", function (event) {
        var mainMenu = new MainMenu();
        mainMenu.showMenu(this.menuIcon, "left-inside", "bottom", 0, 0);
    }, this.menuIcon);

    this.bind("p:DocumentChanged", this.onDocumentChanged, this.node());

    this.bind("p:PageInfoChanged", function (event) {
        this.pageListView.handlePageInfoChangedEvent(event);
    });

    var lastOverflowX = null;
    var lastOverflowY = null;

    var overflowChecker = function () {
        var overflowX = thiz.contentBody.scrollWidth > thiz.contentBody.clientWidth;
        var overflowY = thiz.contentBody.scrollHeight > thiz.contentBody.clientHeight;

        if (lastOverflowX == null || lastOverflowX != overflowX || lastOverflowY == null || lastOverflowY != overflowY) {
            thiz.contentBody.setAttribute("overflowx", overflowX);
            thiz.contentBody.setAttribute("overflowy", overflowY);

            thiz.contentBody.style.transform = "";
            thiz.contentBody.style.transform = "translateZ(0)";
        }

        lastOverflowX = overflowX;
        lastOverdlowY = overflowY;

        window.setTimeout(overflowChecker, 100);
    };
    overflowChecker();

    this.pageListView.setController(this.controller);

    //preventing drag and drop

    document.addEventListener('dragover', function (event) {
        event.preventDefault();
        return false;
    }, false);

    document.addEventListener('drop', function (event) {
        event.preventDefault();
        return false;
    }, false);

    require("./desktop").getDesktopFontConfig(function (config) {
        document.body.style.fontFamily = config.family;
        document.body.style.fontStyle = config.style;
        document.body.style.fontWeight = config.weight;
        document.body.style.fontSize = config.size;
    });

    ApplicationPane._instance = this;
}
__extend(BaseTemplatedWidget, ApplicationPane);
ApplicationPane.prototype.onAttached = function () {
    var thiz = this;
    window.setTimeout(function () {
        thiz.controller.newDocument();
    }, 100);
};
ApplicationPane.prototype.getCanvasContainer = function () {
    return this.contentBody;
};
ApplicationPane.prototype.createCanvas = function () {
    var w = 400;
    var h = 400;

    var doc = this.getCanvasContainer().ownerDocument;

    var wrapper = doc.createElement("div");
    Dom.addClass(wrapper, "CanvasWrapper");
    wrapper.setAttribute("tabindex", 0);

    var container = doc.createElement("div");
    wrapper.appendChild(container);
    container.style.width = w + "px";
    container.style.height = h + "px";
    Dom.addClass(container, "Canvas");

    var canvas = new Canvas(container);

    this.getCanvasContainer().appendChild(wrapper);
    wrapper._canvas = canvas;
    canvas._wrapper = wrapper;

    wrapper.style.display = "none";

    canvas.element.addEventListener("p:SizeChanged", function () {
        var w = Math.ceil(canvas.width * canvas.zoom);
        var h = Math.ceil(canvas.height * canvas.zoom);
        container.style.width = w + "px";
        container.style.height = h + "px";
        container.parentNode.style.width = w + "px";
        container.parentNode.style.height = h + "px";
    }, false);
    return canvas;
};
ApplicationPane.prototype.onDocumentChanged = function () {
    this.pageListView.currentPage = this.controller.activePage;
    this.pageListView.renderPages();
};
ApplicationPane.prototype.testSave = function () {
    this.controller.newDocument();
    var page = this.controller.newPage("Sample page", 1000, 1000, null, null, "");
    page.canvas = Pencil.activeCanvas;

    this.controller.serializePage(page, page.tempFilePath);
};
ApplicationPane.prototype.setActiveCanvas = function (canvas) {
    for (var i = 0; i < this.getCanvasContainer().childNodes.length; i ++) {
        var wrapper = this.getCanvasContainer().childNodes[i];
        if (!wrapper.getAttribute) continue;
        wrapper.style.display = (canvas._wrapper == wrapper) ? "inline-block" : "none";
    }

    Pencil.activeCanvas = canvas;
    this.activeCanvas = canvas;
};
ApplicationPane.prototype.getPreferredCanvasSize = function () {
    return {
        w: Math.round(this.contentBody.offsetWidth - Pencil._getCanvasPadding()),
        h: Math.round(this.contentBody.offsetHeight - Pencil._getCanvasPadding())
    }
};

ApplicationPane.prototype.getBestFitSize = function () {
    var zoom = Pencil.activeCanvas ? (1 / Pencil.activeCanvas.zoom) : 1;
    return [zoom * (this.contentBody.offsetWidth - Pencil._getCanvasPadding()), zoom * (this.contentBody.offsetHeight - Pencil._getCanvasPadding())].join("x");
};
ApplicationPane.prototype.getBestFitSizeObject = function () {
    var zoom = Pencil.activeCanvas ? (1 / Pencil.activeCanvas.zoom) : 1;
    return {width: zoom * (this.contentBody.offsetWidth - Pencil._getCanvasPadding()), height: zoom * (this.contentBody.offsetHeight - Pencil._getCanvasPadding())};
};
ApplicationPane.prototype.showBusyIndicator = function () {
    this.currentBusyOverlay = document.createElement("div");
    document.body.appendChild(this.currentBusyOverlay);
    this.currentBusyOverlay.style.cssText = "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; cursor: wait;";
};
ApplicationPane.prototype.hideBusyIndicator = function () {
    if (this.currentBusyOverlay) {
        if (this.currentBusyOverlay.parentNode) this.currentBusyOverlay.parentNode.removeChild(this.currentBusyOverlay);
        this.currentBusyOverlay = null;
    }
};
ApplicationPane.prototype.busy = function () {
    this.busyCount ++;
    if (this.busyCount == 1) this.showBusyIndicator();
};
ApplicationPane.prototype.unbusy = function () {
    if (this.busyCount > 0) this.busyCount --;
    if (this.busyCount == 0) this.hideBusyIndicator();
};