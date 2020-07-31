$(window).on("load", function () {
  // initialize our loader overlay
  loader.initialize();
  window.addEventListener("load", fadeEffect);
});

$("#map").on("load", hide_loader);

function hide_loader() {
  $(".loading-overlay, .loading-overlay-image-container").hide();
  console.log("loaded");
}
