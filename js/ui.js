$(window).on('load', function() {
    console.log("TESTing");
    $('.loading-overlay, .loading-overlay-image-container').hide();
});

$(document).ready(function() {

    $('.sidebar-left i').click(function() {
        console.log("click");
        $(this).parent().addClass("d-none").removeClass("d-flex");
    });


});