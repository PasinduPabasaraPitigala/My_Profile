/**
 * Canvas Experiment
 * Based on https://tympanus.net/Development/AnimatedHeaderBackgrounds/index.html
 * Deps: GreenSocks TweenLite
 */

/**
 * Constructor
 */
function Animate(canvas, options) {
    this.canvas = canvas;
    this.options = defaults(options || {}, this.options);
    this.init();
}

/**
 * Default options
 */
Animate.prototype.options = {
    density: 10, // Affects how many poitns are created
    speed: 10, // Time in seconds to shift points
    sync: false, // Should points move in sync
    distance: 100, // Distance to move points
    lineColor: '255, 255, 255',
    circleColor: '255, 255, 255',
    radius: 20,
    lineWidth: 1,
    lines: 3,  // Number of closest lines to draw
    updateClosest : false, // Update closet points each loop
    mouse: true, // Link to mouse or random

};

/**
 * Setup everything
 */
Animate.prototype.init = function(){
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.target = {
        position: {
            x: this.width / 2,
            y: this.height / 2
        }
    };

    // Setup canvas
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.ctx = canvas.getContext('2d');

    window.addEventListener('resize', this.resize.bind(this));

    if(this.options.mouse === true && !('ontouchstart' in window) ) {
        window.addEventListener('mousemove', this.mousemove.bind(this));
    }

    this.points = [];
    for(var x = 0; x < this.width; x = x + this.width / this.options.density) {
        for(var y = 0; y < this.height; y = y + this.height/ this.options.density) {
            var point = new Point({
                x: x + Math.random() * this.width/ this.options.density,
                y: y + Math.random() * this.height/this.options.density
            }, this.ctx, this.points.length + 1, this.options);
            this.points.push(point);
        }
    }

    // Setup Circles
    for(var i in this.points) {
        this.points[i].circle = new Circle(this.points[i], this.ctx, this.options);
    }

    this.findClosest(); // Points

    this.animate(); // Start the loop

    this.shiftPoints(); // Start the tween loop

    if(this.options.mouse === false) {
        this.moveTarget(); // Start the random target loop
    }

};

/*
 * Cycles through each Point and finds its neighbors
 */
Animate.prototype.findClosest = function() {
    for(var i = 0; i < this.points.length; i++) {
        // Save the point
        var point = this.points[i];
        // Reset
        point.closest = [];
        // Cycle through the others
        for(var j = 0; j < this.points.length; j++) {
            // Point to test
            var testPoint = this.points[j];
            if(point.id !== testPoint.id) {
                var placed = false, k;
                for (k = 0; k < this.options.lines; k ++) {
                    if(!placed) {
                        if(typeof point.closest[k] === 'undefined') {
                            point.closest[k] = testPoint;
                            placed = true;
                        }
                    }
                }

                for(k = 0; k < this.options.lines; k++){
                    if(!placed) {
                        if(point.distanceTo(testPoint) < point.distanceTo(point.closest[k])) {
                            point.closest[k] = testPoint;
                            placed = true;
                        }
                    }
                }
            }
        }
    }
};

/**
 * Animation Loop
 */
Animate.prototype.animate = function() {
    var i;
    // Should we recalucate closest?
    if(this.options.updateClosest) {
        this.findClosest();
    }

    // Calculate Opacity
    for(i in this.points) {
        if(this.points[i].distanceTo(this.target, true) < 5000) {
            this.points[i].opacity = 0.4;
            this.points[i].circle.opacity = 0.6;
        } else if (this.points[i].distanceTo(this.target, true) < 10000) {
            this.points[i].opacity = 0.2;
            this.points[i].circle.opacity = 0.3;
        } else if (this.points[i].distanceTo(this.target, true) < 30000) {
            this.points[i].opacity = 0.1;
            this.points[i].circle.opacity = 0.2;
        } else {
            this.points[i].opacity = 0.05;
            this.points[i].circle.opacity = 0.05;
        }
    }
    // Clear
    this.ctx.clearRect(0, 0, this.width, this.height);
    for(i in this.points) {

        this.points[i].drawLines();
        this.points[i].circle.draw();
    }
    // Loop
    window.requestAnimationFrame(this.animate.bind(this));
};

/**
 * Starts each point in tween loop
 */
Animate.prototype.shiftPoints = function() {
    for(var i in this.points) {
        this.points[i].shift();
    }
};


/**
 * Make sure the canvas is the right size
 */
Animate.prototype.resize = function() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
};

/**
 * Mouse Move Event - Moves the target with the mouse
 * @param    event   {Object}   Mouse event
 */
Animate.prototype.mousemove = function(event) {
    if(event.pageX || event.pageY) {
        this.target.position.x = event.pageX;
        this.target.position.y = event.pageY;
    } else if(event.clientX || event.clientY) {
        this.target.position.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        this.target.position.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
};

/**
 * Randomly move the target
 */
Animate.prototype.moveTarget = function() {
    var _this = this;
    TweenLite.to(this.target.position, 2, {
        x : (Math.random() * (this.width - 200)) + 100,
        y : (Math.random() * (this.height - 200)) + 100,
        ease: Expo.easeInOut,
        onComplete: function() {
            _this.moveTarget();
        }
    });
};

/**
 * Point Constructor
 * @param    position   {Object}     set of x and u coords
 * @param    ctx        {Object}     Canvas context to draw on
 * @param    options    {Object}     options passed from main function
 */
function Point(position, ctx, id, options) {
    this.options = options || {};
    this.id = id;
    this.ctx = ctx;
    this.position = position || {x: 0, y: 0};
    this.origin = {
        x: this.position.x,
        y: this.position.y
    };
    this.opacity = 0;
    this.closest = [];
}

/**
 * Caluclates the distance to another point
 * @param    point    {Object}    Another Point
 * @param    abs      {Boolean}   Return the absolute value or not
 * @returns  {Number}
 */
Point.prototype.distanceTo = function(point, abs) {
    abs = abs || false;
    var distance = Math.pow(this.position.x - point.position.x, 2) + Math.pow(this.position.y - point.position.y, 2);
    return abs ? Math.abs(distance) : distance;
};

/**
 *  Draws lines to the closet points
 */
Point.prototype.drawLines = function() {
    for(var i in this.closest) {
        if(this.opacity  > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.position.x, this.position.y);
            var test = i + 1;
            if(!this.closest[test]) {
                test = 0;
            }
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = 'rgba(' + this.options.lineColor + ', ' + this.opacity + ')';
            this.ctx.lineWidth = this.options.lineWidth;


            this.ctx.lineTo(this.closest[i].position.x, this.closest[i].position.y);

            this.ctx.stroke();
        }
    }
};

/**
 * Tween loop to move each point around it's origin
 */
Point.prototype.shift = function() {
    var _this = this,
        speed = this.options.speed;

    // Random the time a little
    if(this.options.sync !== true) {
        speed -= this.options.speed * Math.random();
    }
    TweenLite.to(this.position, speed, {
        x : (this.origin.x - (this.options.distance/2) + Math.random() * this.options.distance),
        y : (this.origin.y - (this.options.distance/2) + Math.random() * this.options.distance),
        ease: Expo.easeInOut,
        onComplete: function() {
            _this.shift();
        }
    });
};

/**
 * Circle Constructor
 * @param    point   {Object}    Point object
 * @param    ctx     {Object}    Context to draw on
 * @param    options {Object}    options passed from main function
 */
function Circle(point, ctx, options) {
    this.options = options || {};
    this.point = point || null;
    this.radius = this.options.radius || null;
    this.color = this.options.color || null;
    this.opacity = 0;
    this.ctx = ctx;
}


/**
 * Draws Circle to context
 */
Circle.prototype.draw = function() {
    if(this.opacity > 0) {
        this.ctx.beginPath();
        this.ctx.arc(this.point.position.x, this.point.position.y, this.options.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = 'rgba(' + this.options.circleColor + ', ' + this.opacity + ')';
        this.ctx.fill();
    }
};

// Get the balls rolling
new Animate(document.getElementById('canvas'));


/**
 * Utility Function to set default options
 * @param    object    {object}
 * @param    src  {object}
 */
function defaults(object, src) {
    for(var i in src) {
        if(typeof object[i] === 'undefined') {
            object[i] = src[i];
        }
    }
    return object;
}

/*==================Third page======================*/
    class Example {
    constructor(options) {
    this.root = options.root;

    this.init();

    setTimeout(this.showImages.bind(this), 1000);
}

    init() {
    this.scroll = new LocomotiveScroll({
    el: this.root,
    direction: 'horizontal',
    smooth: true,
    lerp: 0.05,
    tablet: {
    smooth: true
},
    smartphone: {
    smooth: true
}
});

    this.images = this.root.querySelectorAll('.image');

    [].forEach.call(this.images, (image) => {
    image.addEventListener('click', () => {
    image.classList.add('-clicked');
    this.hideImages();
});
});
}

    showImages() {
    [].forEach.call(this.images, (image) => {
    image.classList.remove('-clicked');
    image.classList.add('-active');
});
}

    hideImages() {
    [].forEach.call(this.images, (image) => {
    image.classList.remove('-active');
});

    setTimeout(this.showImages.bind(this), 2000);
}
}


    window.addEventListener('DOMContentLoaded', (event) => {
    const example = new Example({
    root: document.querySelector('.scroll-animations-example')
});
});
/*===========================Fourth Page================================================*/
function Timeline(cvs) {
    var self = this,
        paused = true,
        rafid = 0,
        mouse = { x: 0, y: 0 },
        canvas = cvs,
        ctx = null;

    self.lines = [];

    self.isOK = false;
    self.options = {
        speed: 0.1,
        density: 8,
        radius: 600
    };
    self.targets = [
        [29, 32, 48, 68],
        [29, 33, 38]
    ];
    self.dotColors = [
        ["#13669b", "rgba(19, 102, 155, 0.3)", "rgba(19, 102, 155, 0.08)"],
        ["#7dd317", "rgba(113, 222, 15, 0.3)", "rgba(91, 164, 22, 0.12)"]
    ];

    self.isPaused = function () {
        return paused;
    };

    function InitDots() {
        var tl = $(".timeline");
        var top = tl.find("h2").outerHeight();

        self.lines[0].dots = [];
        var y = top;
        tl.find("article:first figure").each(function () {
            self.lines[0].dots.push([$(this).outerWidth() + 20, y + 20]);

            y += $(this).outerHeight();
        });

        self.lines[1].dots = [];
        var y = top;
        tl.find("article:last figure").each(function () {
            self.lines[1].dots.push([
                canvas.width - $(this).outerWidth() - 20,
                y + 20
            ]);

            y += $(this).outerHeight();
        });
    }

    function OnResize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        var wasPaused = paused;
        self.toggle(false);
        // Init lines
        self.lines[0].reset(canvas.offsetWidth / 2 - 15);
        self.lines[1].reset(canvas.offsetWidth / 2 + 15);

        InitDots();

        self.toggle(!wasPaused);
    }

    function init() {
        var result = false;
        try {
            result = !!(canvas.getContext && (ctx = canvas.getContext("2d")));

            self.lines[0] = new Line(
                0,
                canvas.offsetHeight - 100,
                "#4789a3",
                self.options,
                mouse
            );
            self.lines[1] = new Line(
                0,
                canvas.offsetHeight - 100,
                "#a0d59c",
                self.options,
                mouse
            );
        } catch (e) {
            return false;
        }

        $(canvas).mousemove(function (e) {
            if (e.offsetX) {
                mouse.x = e.offsetX;
                mouse.y = e.offsetY;
            } else if (e.layerX) {
                mouse.x = e.layerX;
                mouse.y = e.layerY;
            } else {
                mouse.x = e.pageX - $(canvas).offset().left;
                mouse.y = e.pageY - $(canvas).offset().top;
            }
        });

        $(window).resize(OnResize);

        OnResize();

        return result;
    }

    function Line(y, height, color, options, mouse) {
        var self = this;

        self.color = color;
        self.options = options;
        self.mouse = mouse;
        self.height = height;
        self.dots = [];
        self.y = y;

        self.points = [];

        self.reset = function (x, f) {
            self.points = [];
            for (var y = self.y; y < self.height; y += self.options.density)
                self.points.push(new Point(x, y, self.color));
        };

        self.update = function () {
            for (var i = 0; i < self.points.length; i++)
                self.points[i].update(self.mouse, self.options);
        };

        function Point(x, y) {
            this.y = y;
            this.x = x;
            this.base = { x: x, y: y };

            this.update = function (mouse, options) {
                var dx = this.x - mouse.x,
                    dy = this.y - mouse.y,
                    alpha = Math.atan2(dx, dy),
                    alpha = alpha > 0 ? alpha : 2 * Math.PI + alpha,
                    d = options.radius / Math.sqrt(dx * dx + dy * dy);

                this.y += Math.cos(alpha) * d + (this.base.y - this.y) * options.speed;
                this.x += Math.sin(alpha) * d + (this.base.x - this.x) * options.speed;
            };
        }
    }

    function drawCircle(p, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
    }

    function drawLine(p1, p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.closePath();
    }

    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < 2; i++) {
            var points = self.lines[i].points;

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = self.lines[i].color;
            ctx.moveTo(points[15].x, points[15].y);

            for (var j = 15; j < points.length - 2; j++) {
                var point = points[j];

                var xc = (points[j + 1].x + point.x) / 2;
                var yc = (points[j + 1].y + point.y) / 2;

                ctx.quadraticCurveTo(point.x, point.y, xc, yc);
            }
            ctx.stroke();
            ctx.closePath();

            // Dots
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = self.dotColors[i][2];
            for (var j = 0; j < self.lines[i].dots.length; j++) {
                var dot = self.lines[i].dots[j],
                    id = self.targets[i][j];
                dot2 = [
                    (self.lines[i].points[id].x + self.lines[i].points[id + 1].x) / 2,
                    (self.lines[i].points[id].y + self.lines[i].points[id + 1].y) / 2
                ];

                var p1 = { x: dot[0], y: dot[1] };
                var p2 = { x: dot2[0], y: dot2[1] };

                drawLine(p1, p2);
                drawCircle(p1, 3, self.dotColors[i][0]);

                drawCircle(p2, 11, self.dotColors[i][1]);
                drawCircle(p2, 5.5, self.dotColors[i][0]);
            }
        }
    }

    function animate() {
        rafid = requestAnimationFrame(animate);

        self.lines[0].update();
        self.lines[1].update();

        redraw();
    }

    self.toggle = function (run) {
        if (!self.isOK) return false;

        if (run === undefined) self.toggle(!paused);
        else if (!!run && paused) {
            paused = false;
            animate();
        } else if (!!!run) {
            paused = true;
            cancelAnimationFrame(rafid);
        }
        return true;
    };

    self.isOK = init();
}
new Timeline($("#cvs3").get(0)).toggle(true);


// /*=================*/
function Timeline(cvs) {
    var self = this,
        paused = true,
        rafid = 0,
        mouse = { x: 0, y: 0 },
        canvas = cvs,
        ctx = null;

    self.lines = [];

    self.isOK = false;
    self.options = {
        speed: 0.1,
        density: 8,
        radius: 600
    };
    self.targets = [
        [29, 32, 48, 68],
        [29, 33, 38]
    ];
    self.dotColors = [
        ["#13669b", "rgba(19, 102, 155, 0.3)", "rgba(19, 102, 155, 0.08)"],
        ["#7dd317", "rgba(113, 222, 15, 0.3)", "rgba(91, 164, 22, 0.12)"]
    ];

    self.isPaused = function () {
        return paused;
    };

    function InitDots() {
        var tl = $(".timeline");
        var top = tl.find("h2").outerHeight();

        self.lines[0].dots = [];
        var y = top;
        tl.find("article:first figure").each(function () {
            self.lines[0].dots.push([$(this).outerWidth() + 20, y + 20]);

            y += $(this).outerHeight();
        });

        self.lines[1].dots = [];
        var y = top;
        tl.find("article:last figure").each(function () {
            self.lines[1].dots.push([
                canvas.width - $(this).outerWidth() - 20,
                y + 20
            ]);

            y += $(this).outerHeight();
        });
    }

    function OnResize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        var wasPaused = paused;
        self.toggle(false);
        // Init lines
        self.lines[0].reset(canvas.offsetWidth / 2 - 15);
        self.lines[1].reset(canvas.offsetWidth / 2 + 15);

        InitDots();

        self.toggle(!wasPaused);
    }

    function init() {
        var result = false;
        try {
            result = !!(canvas.getContext && (ctx = canvas.getContext("2d")));

            self.lines[0] = new Line(
                0,
                canvas.offsetHeight - 100,
                "#4789a3",
                self.options,
                mouse
            );
            self.lines[1] = new Line(
                0,
                canvas.offsetHeight - 100,
                "#a0d59c",
                self.options,
                mouse
            );
        } catch (e) {
            return false;
        }

        $(canvas).mousemove(function (e) {
            if (e.offsetX) {
                mouse.x = e.offsetX;
                mouse.y = e.offsetY;
            } else if (e.layerX) {
                mouse.x = e.layerX;
                mouse.y = e.layerY;
            } else {
                mouse.x = e.pageX - $(canvas).offset().left;
                mouse.y = e.pageY - $(canvas).offset().top;
            }
        });

        $(window).resize(OnResize);

        OnResize();

        return result;
    }

    function Line(y, height, color, options, mouse) {
        var self = this;

        self.color = color;
        self.options = options;
        self.mouse = mouse;
        self.height = height;
        self.dots = [];
        self.y = y;

        self.points = [];

        self.reset = function (x, f) {
            self.points = [];
            for (var y = self.y; y < self.height; y += self.options.density)
                self.points.push(new Point(x, y, self.color));
        };

        self.update = function () {
            for (var i = 0; i < self.points.length; i++)
                self.points[i].update(self.mouse, self.options);
        };

        function Point(x, y) {
            this.y = y;
            this.x = x;
            this.base = { x: x, y: y };

            this.update = function (mouse, options) {
                var dx = this.x - mouse.x,
                    dy = this.y - mouse.y,
                    alpha = Math.atan2(dx, dy),
                    alpha = alpha > 0 ? alpha : 2 * Math.PI + alpha,
                    d = options.radius / Math.sqrt(dx * dx + dy * dy);

                this.y += Math.cos(alpha) * d + (this.base.y - this.y) * options.speed;
                this.x += Math.sin(alpha) * d + (this.base.x - this.x) * options.speed;
            };
        }
    }

    function drawCircle(p, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
    }

    function drawLine(p1, p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.closePath();
    }

    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < 2; i++) {
            var points = self.lines[i].points;

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = self.lines[i].color;
            ctx.moveTo(points[15].x, points[15].y);

            for (var j = 15; j < points.length - 2; j++) {
                var point = points[j];

                var xc = (points[j + 1].x + point.x) / 2;
                var yc = (points[j + 1].y + point.y) / 2;

                ctx.quadraticCurveTo(point.x, point.y, xc, yc);
            }
            ctx.stroke();
            ctx.closePath();

            // Dots
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = self.dotColors[i][2];
            for (var j = 0; j < self.lines[i].dots.length; j++) {
                var dot = self.lines[i].dots[j],
                    id = self.targets[i][j];
                dot2 = [
                    (self.lines[i].points[id].x + self.lines[i].points[id + 1].x) / 2,
                    (self.lines[i].points[id].y + self.lines[i].points[id + 1].y) / 2
                ];

                var p1 = { x: dot[0], y: dot[1] };
                var p2 = { x: dot2[0], y: dot2[1] };

                drawLine(p1, p2);
                drawCircle(p1, 3, self.dotColors[i][0]);

                drawCircle(p2, 11, self.dotColors[i][1]);
                drawCircle(p2, 5.5, self.dotColors[i][0]);
            }
        }
    }

    function animate() {
        rafid = requestAnimationFrame(animate);

        self.lines[0].update();
        self.lines[1].update();

        redraw();
    }

    self.toggle = function (run) {
        if (!self.isOK) return false;

        if (run === undefined) self.toggle(!paused);
        else if (!!run && paused) {
            paused = false;
            animate();
        } else if (!!!run) {
            paused = true;
            cancelAnimationFrame(rafid);
        }
        return true;
    };

    self.isOK = init();
}
new Timeline($("#cvs3").get(0)).toggle(true);


//======================================
