(function ($, window, document, undefined) {

  function MagicInput(element, options) {
    var defaults = {};

    this.$element = $(element);
    this.config = $.extend({}, defaults, options);
  }

  MagicInput.prototype = {

    init : function () {},

    render : function () {},

    bindEvents : function () {
      var self = this;

      this.$container
        .on('click', '', function (e) {
          eventHandlers.onBlur.call(self, e);
        })
        .on()
        .on()
        .on()
        .on();
    },


  };

  var eventHandlers = {

    onBlur : function () {},

    onComboItemMouseOver : function () {},

    onComboItemSelected : function () {},

    onInputClick : function () {},

    onInputFocus : function () {},

    onKeyDown : function () {},

    onKeyUp : function () {},
  };


  $.fn.magicInput = function (options) {
    var obj = $(this);

    if (obj.size() === 1 && obj.data('magicInput')) {
      return obj.data('magicInput');
    }

    obj.each(function (i) {
      var cntr = $(this);

      if (cntr.data('magicInput')) {
        return;
      }

      if (this.nodeName.toLowerCase === 'select') {
        options.data = [];
        options.value = [];
        $.each(this.children, function (index, child) {
          if (child.nodeName && child.nodeName.toLowerCase() === 'option') {
            options.data.push({
              id : child.value,
              name : child.text
            });
            if ($(child).attr('selected')) {
              options.value.push(child.value);
            }
          }
        });
      }

      var def = {};

      $.each(this.attributes, function (i, att) {
        def[att.name] = att.name === 'value' && att.value !== '' ? JSON.parse(att.value) : att.value;
      });

      var field = new MagicInput(this, $.extend([], $.fn.magicInput.defaults, options, def));
      cntr.data('magicInput', field);
      field.container.data('magicInput', field);
    });

    if (obj.size() === 1) {
      return obj.data('magicInput');
    }
    return obj;
  };

  $.fn.magicInput.defaults = {};
})(jQuery, window, document);