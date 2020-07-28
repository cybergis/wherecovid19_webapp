$(function() {

    var isChrome = !!window.chrome && !!window.chrome.webstore;

    console.log(isChrome);

    $('.nav.nav-pills a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('#sidebar_control').on('click', function(e) {
        if ($(".sidebar").hasClass("open")) {
            $('#sidebar_control').removeClass("open").addClass("closed");
            $(".sidebar").css('display', 'none').removeClass("open").addClass("closed");
            $("main").addClass("map-fullscreen");
            window.map.invalidateSize();
        } else {
            $('#sidebar_control').removeClass("closed").addClass("open");
            $(".sidebar").css('display', 'flex').removeClass("closed").addClass("open");
            $("main").removeClass("map-fullscreen");
            window.map.invalidateSize();
        }
    });

    $('#table-screen-btn').on('click', function(e) {
        $('.content-section').css("transform", "translateX(0%)");
        $('.screen-btn').removeClass('active');
        $(this).addClass('active');
    });
    $('#map-screen-btn').on('click', function(e) {
        $('.content-section').css("transform", "translateX(-100%)");
        $('.screen-btn').removeClass('active');
        $(this).addClass('active');
    });

    $('#about-screen-btn').on('click', function(e) {
        $('.content-section').css("transform", "translateX(-200%)");
        $('.screen-btn').removeClass('active');
        $(this).addClass('active');
    });

    $('#close_chart').on('click', function(e) {
        document.getElementById('myChart').classList.add("d-none");
        document.getElementById('myChart').classList.remove("d-block");
    });

});