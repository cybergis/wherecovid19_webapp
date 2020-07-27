$(function() {

    var isChrome = !!window.chrome && !!window.chrome.webstore;

    console.log(isChrome);

    var close_sidebar = function(){
        $('#sidebar_control').removeClass("open").addClass("closed");
        $(".sidebar").css('display', 'none').removeClass("open").addClass("closed");
        $("main").addClass("map-fullscreen");
      }

      var open_sidebar = function(){
        $('#sidebar_control').removeClass("closed").addClass("open");
        $(".sidebar").css('display', 'flex').removeClass("closed").addClass("open");
        $("main").removeClass("map-fullscreen");
      }

      
    $('#sidebar_control').on('click', function(e) {
        if ($(".sidebar").hasClass("open")) {
            close_sidebar();
        } else {
           open_sidebar();
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

    $(".app-drawer").on('click',function(){
        if($(this).hasClass('opened')){
            $(this).removeClass('opened');
        } else {
            $(this).addClass("opened");
        }
    });

    ////////////////////////////
    // Handle Form submission///
    ////////////////////////////

    $( "#variables_form" ).submit(function( event ) {
        // close_sidebar();
        // alert( "Handler for .submit() called." );
        event.preventDefault();

        var formEl = $(this);
        var submitButton = $('#variables_form_submit_btn');

        //console.log(submitButton);

        $.ajax({
            type: 'POST',
            url: "http://hsjp10.cigi.illinois.edu:8000/vne",
            // accept: {
            //     javascript: 'application/javascript'
            // },
            // contentType: 'application/json',
            data: JSON.stringify(formEl.serializeArray()), 
            dataType : 'json', // what type of data do we expect back from the server
            // encode : true,
            beforeSend: function() {
                $('.overlay-loading ').removeClass('d-none').addClass('d-flex');
                submitButton.prop( "disabled", true );

            }
        })
        .done(function(data){
            // log data to the console so we can see
            //console.log(data);
            // here we will handle errors and validation messages
            if (data.job_id) {
                console.log(data.job_id);
                check_jobstatus(data.job_id, submitButton)
            }
        })// using the fail promise callback
        .fail(function(data) {
            console.log("Error 1");
        });
    });

    var check_jobstatus = function(job_id, submitButton){
        //console.log(job_id);
        var check_url = 'http://hsjp10.cigi.illinois.edu:8000/check/'+job_id;
        
        $.ajax({
            type: 'GET',
            url: check_url,
            success: function(data){
                // log data to the console so we can see
                console.log(data.status);
                    // here we will handle errors and validation messages
                if("SUCCESS" == data.status){
                    $('.overlay-loading ').removeClass('d-flex').addClass('d-none');
                    submitButton.prop( "disabled", false );
                    close_sidebar();
                    var generated_results = "http://hsjp10.cigi.illinois.edu:8000/job_outputs/"+data.job_id+"/index.html"
                    $('<iframe>', {
                        src: generated_results,
                        id:  'vne',
                        frameborder: 0,
                        scrolling: 'yes'
                        }).appendTo('#results');

                } else {
                    // Schedule the next
                    setTimeout(check_jobstatus, 3000, data.job_id, submitButton);
                }
            }
        });
    }


});