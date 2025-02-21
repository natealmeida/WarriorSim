var SIM = SIM || {};

SIM.MATRIX = {

    init: function() {
        var view = this;
        view.variables();
        view.events();
        view.buildMatrix();
    },

    variables: function() {
        var view = this;
        view. body = $('body');
        view.section = view.body.find('section.matrix');
        view.container = view.section.find('.container');
        view.close = view.section.find('.btn-close');

    },

    events: function() {
        var view = this;
        view.close.click(function(e) {
            e.preventDefault();
            $('.js-matrix').removeClass('active');
            $('section.matrix').removeClass('active');
            view.body.addClass('sidebar-mobile-open');
        });
    }
}