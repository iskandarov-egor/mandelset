# A WebGL-based mandelbrot set explorer for desktop web browsers

[http://mandelset.ru](http://mandelset.ru)

## Features:
* Renders on the GPU using WebGL 2.0
* Can zoom up to the depth of about 2e-30
* Utilizes the perturbation method, which allows it render faster and create deeper zooms than what the default single presicion float of WebGL 2.0 would allow
* Supports multisampling to get smoother images
* Allows to color the rendered fractal without completely re-rendering it
* Smooth panning and zooming without waiting for the new view to render completely

## Gallery
[![](./gallery/preview/1.jpg)](./gallery/1.jpg)
[![](./gallery/preview/2.jpg)](./gallery/2.jpg)
[![](./gallery/preview/3.jpg)](./gallery/3.jpg)
[![](./gallery/preview/4.jpg)](./gallery/4.jpg)
[![](./gallery/preview/5.jpg)](./gallery/5.jpg)
[![](./gallery/preview/6.jpg)](./gallery/6.jpg)
