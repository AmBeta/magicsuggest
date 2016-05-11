(function ($, window, document, undefined) {

  function MagicInput(formField, options) {
    var defaults = {
      noResultsText : 'Cannot find this item '
    };

    this.$formField = $(formField);
    this.config = $.extend({}, defaults, options);

    this.init();
  }

  MagicInput.prototype = {

    init : function () {
      this.$container = null;
      this.$trigger = null;
      this.$suggest = null

      this._allItems = this.config.data;

      this.render();
      this.renderSuggest(this._allItems);
      this.bindEvents();
    },

    render : function () {
      var fieldName = this.$formField.attr('name');

      this.$container = $('<div />', {
        'class' : 'form-group dropdown mi-ctn',
      });

      this.$input = $('<input />', {
        'name' : fieldName,
        'type' : 'text',
        'class' : 'form-control mi-input',
        'placeholder' : this.config.placeholder
      });

      if (this.config.trigger) {
        this.$trigger = $('<button />', {
          'class' : 'btn btn-default dropdown-toggle',
          'type' : 'button',
        }).append($('<span class="caret"></span>'));
      }

      this.$suggest = $('<ul />', {
        'class' : 'dropdown-menu mi-suggest-ctn',
        'style' : 'overflow-y:auto;'
      }).css({
        'width' : '100%',
        'max-height' : '145px'
      });

      this.$container.append(this.$input).append(this.$trigger).append(this.$suggest);
      this.$formField.replaceWith(this.$container);
    },

    renderSuggest : function (items) {
      var self = this;
      self.$suggest.empty();
      $.each(items, function (idx, item) {
        var $item = $('<li />', {
          'id' : item.id || miUtils.id(),
          'class' : 'mi-suggest-item',
          'data-json' : JSON.stringify(item),
        }).append($('<a />', {
          'href' : 'javascript:void(0);',
          'html' : item.value || item
        }));
        self.$suggest.append($item);
      });
    },

    bindEvents : function () {
      var self = this;

      this.$container
        .on('click', 'input', function (evt) {
          eventHandlers.onFocus.call(self, evt);
        })
        .on('blur', 'input', function (evt) {
          eventHandlers.onBlur.call(self, evt);
        })
        .on('mousedown', '.mi-suggest-item', function (evt) {
          eventHandlers.onComboItemSelected.call(self, evt);
        })
        // .on('change', 'input', function (evt) {
        //   eventHandlers.onChange.call(self, evt);
        // })
        .on('keyup', 'input', function (evt) {
          eventHandlers.onKeyUp.call(self, evt);
        });
    },

    collapse : function () {
      this.$container.removeClass('open');
    },

    expand : function () {
      this.$container.addClass('open');
    },

    searchResults : function () {
      var suggestedItems = [],
          searchText = this.getSearchText(),
          escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          zregex = new RegExp(escapedSearchText, 'i'),
          regex = this.getSearchRegex(escapedSearchText);

      if (!searchText.length) {
        this.renderSuggest(this._allItems);
        return;
      }

      // SEARCHING...
      console.log('Searching for ' + searchText + '...');

      if (suggestedItems.length > 0) {
        this.renderSuggest(suggestedItems);
      } else {
        this.renderNoResults(searchText);
      }
    },

    getSearchText : function () {
      if (this.$input.val() === this.defaultText) {
        return '';
      } else {
        return $.trim(this.$input.val());
      }
    },

    getSearchRegex : function () {},

    renderNoResults : function (searchText) {
      this.$suggest.empty().append($('<li />', {
        'class' : 'mi-no-results',
        'text' : this.config.noResultsText + '\"' + searchText + '\"'
      }));
    },
  };

  /**************** PRIVATE VARIABLES *****************/
  var miUtils = {
    id : (function () {
      var idx = 0;
      return function () {
        idx = idx < 999 ? idx : 0;
        return 'mi-id-' + idx++;
      };
    })()
  };

  var eventHandlers = {

    onBlur : function () {
      this.collapse();
    },

    onFocus : function () {
      this.expand();
    },

    onChange : function () {
    },

    onComboItemMouseOver : function () {},

    onComboItemSelected : function (evt) {
      var target = evt.srcElement || evt.target,
          $target = $(target);
      this.$input.val($target.text());
    },

    onInputClick : function () {},

    onInputFocus : function () {},

    onKeyDown : function () {},

    onKeyUp : function (evt) {
      var stroke;
      switch (stroke) {
        case 13:
          evt.preventDefault();
          break;
        default:
          this.searchResults();
      }
    },
  };

  /************ EXPORT TO JQUERY NAMESPACE ************/
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