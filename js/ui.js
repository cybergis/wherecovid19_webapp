$(window).on('load', function() {
    // initialize our loader overlay
    loader.initialize();
    //window.setTimeout(hide_loader, 500);
});

function hide_loader() {
    $('.loading-overlay, .loading-overlay-image-container').hide();
    console.log("loaded");
}