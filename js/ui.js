$(window).on("load", function () {
  // initialize our loader overlay
  // loader.initialize();
});

$("#map").on("load", hide_loader);

function show_loader() {
  $(".loading-overlay, .loading-overlay-image-container").show();
  console.log("Showing loader");
}


function hide_loader() {
  $(".loading-overlay, .loading-overlay-image-container").hide();
  console.log("Hiding loader");
}
