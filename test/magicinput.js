(function ($, window, document, undefined) {

  function MagicInput(formField, options) {
    var defaults = {
      comboWidth : '100%',
      comboMaxHeight : '140px',
      trigger : true,
      placeholder : '',
      noResultsText : 'Cannot find item ',
    };

    this.$formField = $(formField);
    this.config = $.extend({}, defaults, options);

    this.init();
  }

  MagicInput.prototype = {

    init : function () {
      this.$container = null;
      this.$trigger = null;
      this.$suggest = null;

      this.render();
      this.bindEvents();
      this.reset(this.config);
    },

    reset : function (options) {
      this.config = $.extend(this.config, options);
      this._allSuggests = this.initAllSuggests(this.config.data);
      this.renderSuggest(this._allSuggests);
    },

    initAllSuggests : function (data) {
      var self = this;
      var suggests = $.map(data, function (item, idx) {
        return {
          id : item.id || miUtils.id(),
          value : item.value || item
        };
      });
      return $.map(suggests, function (item, idx) {
        return $.extend(item, {
          searchText : item.value
        });
      });
    },

    render : function () {
      var fieldName = this.$formField.attr('name');

      this.$container = $('<div />', {
        'class' : 'dropdown mi-ctn',
      });

      this.$input = $('<input />', {
        'name' : fieldName,
        'type' : 'text',
        'class' : 'form-control mi-input',
        'placeholder' : this.config.placeholder,
        'autocomplete' : 'off'
      }).css({
        // fix problem in bootstrap style of `.form-control`
        'float' : 'none'
      });

      if (this.config.trigger) {
        this.$trigger = $('<span class="caret"></span>').css({
          'position' : 'absolute',
          'right' : '10px',
          'top' : '50%'
        });
      }

      this.$suggest = $('<ul />', {
        'class' : 'dropdown-menu mi-suggest-ctn',
        'style' : 'overflow-y:auto;overflow-x:hidden;'
      }).css({
        'width' : this.config.comboWidth,
        'max-height' : this.config.maxHeight
      });

      this.$container.append(this.$input).append(this.$trigger).append(this.$suggest);
      this.$formField.replaceWith(this.$container);
    },

    renderSuggest : function (items) {
      var self = this,
          highlighted = items.length == 1 ? 'bg-info' : '';
      self.$suggest.empty();
      $.each(items, function (idx, item) {
        var $item = $('<li />', {
          'id' : 'mi_li_' + item.id,
          'class' : 'mi-suggest-item ' + highlighted,
          'data-json' : JSON.stringify(item),
        }).append($('<a />', {
          'href' : 'javascript:void(0);',
          'html' : item.value
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
        .on('keydown', 'input', function (evt) {
          eventHandlers.onKeyDown.call(self, evt);
        })
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
      var self = this,
          suggestedItems = [],
          searchText = this.getSearchText(),
          escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          regex = this.getSearchRegex(escapedSearchText);

      if (!searchText.length) {
        this.renderSuggest(this._allSuggests);
        return;
      }

      // Search for results
      if (this.config.matchFn && $.isFunction(this.config.matchFn)) {
        suggestedItems = this.config.matchFn(escapedSearchText);
      } else {
        $.each(this._allSuggests, function (idx, item) {
          var searchMatch = self.searchStringMatch(item.searchText, regex);
          item.searchMatch = searchMatch;
          if (searchMatch) suggestedItems.push(item);
        });
      }

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

    getSearchRegex : function (searchText) {
      if (this.searchContains) {
        return new RegExp(searchText, 'i');
      }
      return new RegExp('^' + searchText, 'i');
    },

    searchStringMatch : function (searchString, regex) {
      if (regex.test(searchString)) {
        return true;
      } else if (this.config.enableSplitWordSearch && 
                  (searchString.indexOf(' ') >= 0 || searchString.indexOf('[') === 0)) {
        var parts = searchString.replace(/\[|\]/g, '').split(' ');
        if (parts.length) {
          for (var i = 0, len = parts.length; i < len; i++) {
            if (regex.test(parts[i])) {
              return true;
            }
          }
        }
      }
      return false;
    },

    renderNoResults : function (searchText) {
      this.$suggest.empty().append($('<li />', {
        'class' : 'mi-no-results bg-warning',
        'text' : this.config.noResultsText + '\"' + searchText + '\"'
      }).css({
        'padding' : '3px 15px'
      }));
    },

    switchHighlighted : function (stroke) {
      var self = this,
          $curr = self.$suggest.find('li.bg-info'),
          $next = null;
      if ($curr.length == 0) {
        self.$suggest.find('li:first').addClass('bg-info');
        return;
      }
      switch (stroke) {
        case 38:  // Up
          $next = $curr.prev('li');
          break;
        case 40:  // Down
          $next = $curr.next('li');
          break;
      }
      if ($next.length) {
        // move the next item to view
        var viewTop = self.$suggest.scrollTop(),
            viewHeight = self.$suggest.height(),
            itemHeight = self.$suggest.find('li').height(),
            itemTop = $next.position().top;
        if (itemTop < 5) {
          self.$suggest.scrollTop(viewTop - itemHeight);
        } else if (itemTop > viewHeight) {
          self.$suggest.scrollTop(viewTop + itemHeight);
        }

        $curr.removeClass('bg-info');
        $next.addClass('bg-info');
      }
    },

    chooseHighlighted : function () {
      var self = this,
          $highlighted = self.$suggest.find('li.bg-info');
      if ($highlighted.length) {
        self.$input.val($highlighted.find('a').html());
        self.$input.blur();
      }
    },
  };

  /**************** PRIVATE VARIABLES *****************/
  var miUtils = {
    id : (function () {
      var idx = 0;
      return function () {
        idx = idx < 999 ? idx : 0;
        return idx++;
      };
    })()
  };

  var eventHandlers = {

    onBlur : function () {
      var self = this;
      self.collapse();
      self.$suggest.find('li.bg-info').removeClass('bg-info');
    },

    onFocus : function () {
      var self = this;
      self.expand();
      self.searchResults();
    },

    onComboItemSelected : function (evt) {
      var target = evt.srcElement || evt.target,
          $target = $(target);
      this.$input.val($target.html());
    },

    onKeyDown : function (evt) {
      var self = this,
          stroke, tmp;
      stroke = (tmp = evt.which) != null ? tmp : evt.keyCode;
      switch (stroke) {
        case 38:  // Up
        case 40:  // Down
          evt.preventDefault();
          self.switchHighlighted(stroke);
          break;
        case 13:  // Enter
          evt.preventDefault();
          self.chooseHighlighted();
          break;
      }
    },

    onKeyUp : function (evt) {
      var self = this,
          stroke, tmp;
      stroke = (tmp = evt.which) != null ? tmp : evt.keyCode;
      switch (stroke) {
        case 38:  // Up
        case 40:  // Down
        case 13:  // Enter
          evt.preventDefault();
          break;
        default:
          self.searchResults();
      }
    },
  };

  /************ EXPORT TO JQUERY NAMESPACE ************/
  $.fn.magicInput = function (options) {
    var obj = $(this);

    if (obj.size() === 1 && obj.data('magicInput')) {
      obj.data('magicInput').reset(options);
      return obj.data('magicInput');
    }

    obj.each(function (i) {
      var cntr = $(this);

      if (cntr.data('magicInput')) {
        cntr.data('magicInput').reset(options);
        return;
      }

      // support for `select` tag
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
      field.$input.data('magicInput', field);
    });

    return obj;
  };

  $.fn.magicInput.defaults = {};
})(jQuery, window, document);