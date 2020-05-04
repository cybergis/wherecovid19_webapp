$(function() {
    $('.nav.nav-pills a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });

    var illinois_table = $('#illinois-table').DataTable({
        paging: false,
        ordering: true,
        info: false,
        dom: "t",
    });

    $('#il-search-input').on('input', function() {
        console.log($('#il-search-input').val());
        illinois_table.search($('#il-search-input').val()).draw();
    });

    var world_table = $('#world-table').DataTable({
        paging: false,
        ordering: true,
        info: false,
        dom: "t",
    });

    $('#w-search-input').on('input', function() {
        console.log($('#w-search-input').val());
        world_table.search($('#w-search-input').val()).draw();
    });



});