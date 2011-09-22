App = function() {
    var canvas;
    var ctx;
    var tid_runFrame;
    var time;
    var mouseDown;
    var showBounds = false;
    var showContacts = false;
    var space;

    function main() {
        canvas = document.getElementById("canvas");
        if (!canvas.getContext) {
            alert("Couldn't get canvas object !");
        }

        ctx = canvas.getContext("2d");

        canvas.addEventListener("mousedown", function(e) { onMouseDown(e) }, false);
        canvas.addEventListener("mouseup", function(e) { onMouseUp(e) }, false);
        canvas.addEventListener("mousemove", function(e) { onMouseMove(e) }, false);

        canvas.addEventListener("touchstart", touchHandler, false);
        canvas.addEventListener("touchend", touchHandler, false);
        canvas.addEventListener("touchmove", touchHandler, false);
        canvas.addEventListener("touchcancel", touchHandler, false);

        if (document.addEventListener)
        {
            document.addEventListener("keydown", onKeyDown, false);
            document.addEventListener("keyup", onKeyUp, false);
            document.addEventListener("keypress", onKeyPress, false);
        }
        else if (document.attachEvent)
        {
            document.attachEvent("onkeydown", onKeyDown);
            document.attachEvent("onkeyup", onKeyUp);
            document.attachEvent("onkeypress", onKeyPress);
        }
        else
        {
            document.onkeydown = onKeyDown;
            document.onkeyup = onKeyUp
            document.onkeypress = onKeyPress;
        }

        // transform fundamental coordinate system
        ctx.translate(canvas.width * 0.5, canvas.height);
        ctx.scale(1, -1);

        time = 0;

		tid_runFrame = setTimeout(function() { runFrame(1000/60); }, 1000/60);

        Collision.init();

        init();
    }

    function init() {
        var body;
        var shape;

        space = new Space();
        space.gravity = vec2.create(0, -500);

        shape = new ShapeSegment(vec2.create(-400, 0), vec2.create(400, 0), 0);
        space.staticBody.addStaticShape(shape);

        shape = new ShapeSegment(vec2.create(-400, 0), vec2.create(-400, 600), 0);
        space.staticBody.addStaticShape(shape);

        shape = new ShapeSegment(vec2.create(400, 0), vec2.create(400, 600), 0);
        space.staticBody.addStaticShape(shape);

        shape = new ShapeSegment(vec2.create(-50, 0), vec2.create(50, 0), 20);
        shape.e = 0.75;
        shape.u = 1.0;
        body = new Body(1, shape.inertia(1));
        body.addShape(shape);
        body.p.set(-150, 600);
        space.addBody(body);

        shape = new ShapeBox(150, 120);
        shape.e = 0.75;
        shape.u = 1.0;
        body = new Body(2, shape.inertia(2));
        body.addShape(shape);
        body.p.set(-150, 100);
        space.addBody(body);

        shape = new ShapeBox(600, 15);
        shape.e = 0.75;
        shape.u = 1.0;
        body = new Body(4, shape.inertia(4));
        body.addShape(shape);
        body.p.set(0, 180);
        space.addBody(body);

        shape = new ShapeCircle(30);
        shape.e = 0.75;
        shape.u = 0.75;
        body = new Body(1, shape.inertia(1));
        body.addShape(shape);
        body.p.set(-150, 520);
        space.addBody(body);

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j <= i; j++) {
                shape = new ShapeBox(50, 50);
                shape.e = 0.75;
                shape.u = 1.0;
                body = new Body(1, shape.inertia(1));
                body.addShape(shape);
                body.p.set((j - i * 0.5) * 55 - 150, 400 - i * 55);
                space.addBody(body);
            }
        }

        shape = new ShapePoly([vec2.create(-35, 35), vec2.create(-50, 0), vec2.create(-35, -35), vec2.create(35, -35), vec2.create(50, 0), vec2.create(35, 35)]);
        shape.e = 0.75;
        shape.u = 0.5;
        body = new Body(5, shape.inertia(5));
        body.addShape(shape);
        body.p.set(150, 2000);
        space.addBody(body);
        body.applyForce(vec2.create(0, 100), vec2.create(0, 100));

/*      for (var i = 0; i < 9; i++) {
            for (var j = 0; j <= i; j++) {
                shape = new ShapeBox(50, 50);
                shape.e = 0.25;
                shape.u = 0.8;
                body = new Body(1, shape.inertia(1));
                body.addShape(shape);
                body.p.set((j - i * 0.5) * 55, 600 - i * 55);
                space.addBody(body);
            }
        }

        shape = new ShapeCircle(25);
        shape.e = 0.5;
        shape.u = 1;
        body = new Body(1, shape.inertia(1));
        body.addShape(shape);
        body.p.set(0, 25);
        space.addBody(body);*/
    }

    function bodyColor(index) {
        var iarr = [80, 120, 155, 185, 210, 230, 245, 255];

        var r = iarr[((index + 1) * 17) % iarr.length];
        var g = iarr[((index + 1) * 43) % iarr.length];
        var b = iarr[((index + 1) * 87) % iarr.length];

        return "rgb(" + r + "," + g + "," + b + ")";
    }

    function runFrame(ms) {
        time += ms;

        space.step(ms / 1000);

        clearCanvas(0, 0, canvas.width, canvas.height);

        drawBody(space.staticBody, "#888", "#000");
        for (var i = 0; i < space.bodyArr.length; i++) {
            drawBody(space.bodyArr[i], bodyColor(i), "#000");
        }

        if (showContacts) {
            for (var i = 0; i < space.arbiterArr.length; i++) {
                var arbiter = space.arbiterArr[i];
                for (var j = 0; j < arbiter.contactArr.length; j++) {
                    var con = arbiter.contactArr[j];
                    drawCircle(con.p, 2.5, 0, "#F00");
                    drawArrow(con.p, vec2.add(con.p, vec2.scale(con.n, con.d)), "#F00");
                }
            }
        }

        tid_runFrame = setTimeout(function() { runFrame(ms); }, ms);
    }

    function clearCanvas(x, y, w, h) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(x, y, w, h);
        ctx.restore();
    }

    function drawBody(body, fillColor, outlineColor) {
        for (var i = 0; i < body.shapeArr.length; i++) {
            drawBodyShape(body, body.shapeArr[i], fillColor, outlineColor);
        }
    }

    function drawBodyShape(body, shape, fillColor, outlineColor) {
        switch (shape.type) {
        case Shape.TYPE_CIRCLE:
            drawCircle(shape.tc, shape.r, body.a, fillColor, outlineColor);
            break;
        case Shape.TYPE_SEGMENT:
            drawSegment(shape.ta, shape.tb, shape.r, fillColor, outlineColor);
            break;
        case Shape.TYPE_POLY:
            drawPolygon(shape.tverts, fillColor, outlineColor);
            break;
        }

        if (showBounds) {
            var offset = vec2.create(1, 1);
            drawBox(vec2.sub(shape.mins, offset), vec2.add(shape.maxs, offset), null, "#0A0");
        }
    }

    function drawArrow(p1, p2, strokeStyle) {
        var angle = vec2.toAngle(vec2.sub(p2, p1)) - Math.PI;

        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        ctx.save();
        ctx.translate(p2.x, p2.y);

        ctx.rotate(angle - Math.PI * 0.15);
        ctx.moveTo(6, 0);
        ctx.lineTo(0, 0);

        ctx.rotate(Math.PI * 0.3);
        ctx.lineTo(6, 0);
        
        ctx.lineJoint = "miter"
        ctx.stroke();
        ctx.restore();
    }

    function drawBox(mins, maxs, fillStyle, strokeStyle) {
        ctx.beginPath();
        ctx.rect(mins.x, mins.y, maxs.x - mins.x, maxs.y - mins.y);

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    function drawCircle(center, radius, angle, fillStyle, strokeStyle) {
        ctx.beginPath();

        ctx.arc(center.x, center.y, radius, 0, Math.PI*2, true);
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.moveTo(center.x, center.y);
            var rt = vec2.add(center, vec2.scale(vec2.rotation(angle), radius));
            ctx.lineTo(rt.x, rt.y);
            ctx.stroke();
        }
    }

    function drawSegment(a, b, radius, fillStyle, strokeStyle) {
        ctx.beginPath();

        var dn = vec2.normalize(vec2.perp(vec2.sub(b, a)));
        var start_angle = dn.toAngle(); 
        ctx.arc(a.x, a.y, radius, start_angle, start_angle + Math.PI, false);

        var ds = vec2.scale(dn, -radius);
        var bp = vec2.add(b, ds);
        ctx.lineTo(bp.x, bp.y);

        start_angle += Math.PI;
        ctx.arc(b.x, b.y, radius, start_angle, start_angle + Math.PI, false);

        ds = vec2.scale(dn, radius);
        var ap = vec2.add(a, ds);
        ctx.lineTo(ap.x, ap.y);

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    function drawPolygon(verts, fillStyle, strokeStyle) {
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        
        for (var i = 0; i < verts.length; i++) {
            ctx.lineTo(verts[i].x, verts[i].y);
        }

        ctx.lineTo(verts[verts.length - 1].x, verts[verts.length - 1].y);
        ctx.closePath();

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    function getMousePoint(e) {
        return { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop } 
    }

    function onMouseDown(e) {
        mouseDown = true;
        var point = getMousePoint(e);
    }

    function onMouseUp(e) { 
	    if (mouseDown) {
            mouseDown = false;
		}
	}

    function onMouseMove(e) {
        var point = getMousePoint(e);
        if (mouseDown) {
        }
    }

    function touchHandler(e) {
        var touches = e.changedTouches;
        var first = touches[0];
        var type = "";

        switch (e.type) {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type = "mousemove"; break;        
        case "touchend":   type = "mouseup"; break;
        default: return;
        }

        //initMouseEvent(type, canBubble, cancelable, view, clickCount, 
        //           screenX, screenY, clientX, clientY, ctrlKey, 
        //           altKey, shiftKey, metaKey, button, relatedTarget);   
        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                                      first.screenX, first.screenY, 
                                      first.clientX, first.clientY, false, 
                                      false, false, false, 0/*left*/, null);

        first.target.dispatchEvent(simulatedEvent);
        e.preventDefault();
    }

    function onKeyDown(e) {
        if (!e) {
            e = event;
        }

        if (e.keyCode == 32) {
            shape = new ShapeCircle(20);
            shape.e = 0.5;
            shape.u = 0.5;
            body = new Body(0.2, shape.inertia(0.2));
            body.addShape(shape);
            body.p.set(0, 500);
            space.addBody(body);

            body.applyImpulse(vec2.create((Math.random() - 0.5) * 100, Math.random() * 100), vec2.create(0, 10)); 
        }

        if (e.keyCode == 66) { // 'b'
            showBounds = !showBounds;
        }

        if (e.keyCode == 67) { // 'c'
            showContacts = !showContacts;
        }

        if (e.keyCode == 82) { // 'r'
            init();
        }
    }

    function onKeyUp(e) {
        if (!e) {
            e = event;
        }
    }

    function onKeyPress(e) {
        if (!e) {
            e = event;
        }
    }

	return { main: main };
}();