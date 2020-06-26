$(function() {
    $('.nav.nav-pills a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('#sidebar_control').on('click', function(e) {
        if ($(".sidebar").hasClass("open")) {
            $('#sidebar_control').removeClass("open").addClass("closed");
            $(".sidebar").animate({ width: 'toggle' }, 10).removeClass("open").addClass("closed");
            $("main").addClass("map-fullscreen");
        } else {
            $('#sidebar_control').removeClass("closed").addClass("open");
            $(".sidebar").animate({ width: 'toggle' }, 10).removeClass("closed").addClass("open");
            $("main").removeClass("map-fullscreen");
        }
    });

    $('#sidebar_control_mobile_close').on('click', function(e) {
        $('#sidebar_control').removeClass("open").addClass("closed");
        $(".sidebar").animate({ width: 'toggle' }, 10).removeClass("open").addClass("closed");
        $("main").addClass("map-fullscreen");
        $("#sidebar_control_mobile_open").addClass("d-block");
    });

    $('#sidebar_control_mobile_open').on('click', function(e) {
        $('#sidebar_control').removeClass("closed").addClass("open");
        $(".sidebar").animate({ width: 'toggle' }, 10).removeClass("closed").addClass("open");
        $("main").removeClass("map-fullscreen");
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

});