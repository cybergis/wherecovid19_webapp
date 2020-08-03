$(function () {
  $("#wherecovid_app").attr("href", "http://" + window.location.host);
  $("#vne_app").attr(
    "href",
    "http://" + window.location.host + "/vulnerability-explorer/"
  );

  $(".app-drawer").on("click", function () {
    console.log($(".app-drawer").hasClass("opened"));

    if ($(".app-drawer").hasClass("opened")) {
      $(".app-drawer").removeClass("opened");
    } else {
      $(".app-drawer").addClass("opened");
    }
  });
}); //End main function
