$( window ).on('load', function() {
    // initialize our loader overlay
    loader.initialize();
    console.log("TESTing");
    window.setTimeout(hide_loader, 10000);
});

function hide_loader() {
    $('.loading-overlay, .loading-overlay-image-container').hide();
    console.log("loaded");
}