(function ($, window, document, undefined) {

  AbstractMagicInput = (function () {
    function AbstractMagicInput (formField, options) {
      this.formField = formField;
      this.options = options || {};

      this.isMultiple = this.formField.multiple && (this.options.maxSelection > 1);
      this.setDefaultText();
      this.setDefaultValues();
      this.setup();
      this.setupHtml();
      this.registerObservers();
    }

    AbstractMagicInput.prototype = {
      setDefaultValues : function () {
        var self = this;
      }, 

      setDefaultText : function () {

      },

      keyupChecker : function () {
        var stroke, ref;
        stroke = (ref = evt.which) ? ref : evt.keyCode;
        switch (stroke) {
          case 13: // `Enter`
            evt.preventDefault();
            if (this.resultsShowing) {
              return this.resultSelect(evt);
            }
            break;
          case 27:
            if (this.resultsShowing) {
              this.resultsHide();
            }
            return true;
          case 9:
          case 38:
          case 40:
          case 16:
          case 91:
          case 17:
            break;
          default:
            return this.resultsSearch();
        }
      },

      clipboardEventChecker : function (evt) {},

      resultsSearch : function () {
        if (this.resultsShowing) {
          return this.winnowResults();
        } else {
          return this.resultsShow();
        }
      },

      winnowResults : function () {
        var option,
            results = 0,
            searchText = this.getSearchText(),
            escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
            regexAnchor = this.searchContains ? '' : '^',
            regex = new RegExp(regexAnchor + escapedSearchText, 'i'),
            zregex = new RegExp(escapedSearchText, 'i'),
            data = this.resultData;

        if (this.options.getMatchedFn && $.isFunction(this.options.getMatchedFn)) {

        } else {

        }

        this.resultClearHighlight();
        if (results < 1 && searchText.length) {
          this.updateResultsContent('');
          return this.noResults(searchText);
        } else {
          this.updateResultsContent(this.resultsOptionBuild());
          return this.winnowResultsSetHighlight();
        }
      },

      isBrowserSupport : function () {},

      defMultipleTest : 'Select Some Options',

      defSingleTest : 'Select an Option',

      defNoResultText : 'No Results Match'
    };

    return AbstractMagicInput;

  })();


  MagicInput = (function (_super) {
    function MagicInput () {
      return _super.apply(this, arguments);
    }

    MagicInput.prototype = $.extend(_super.prototype, {
      setup : function () {
        this.$formField = $(this.formField);
        this.currentSelectedIndex = this.formField.selectedIndex || null;
      },

      setupHtml : function () {
        var containerClz, containerProps,
            containerWidth = this.$formField.width();
        containerClz = ['chosen-container'];
        containerProps = {
          'class' : containerClz.join(' '),
          'style' : 'width: ' + containerWidth + 'px;',
          'title' : this.formField.title
        };
        this.$container = $('<div />', containerProps);

        // holds the input field
        var inputProps = {
          'type'        : 'text',
          'class'       : 'mi-search-input',
          'readonly'    : !this.options.editable,
          'placeholder' : this.options.placeholder,
          'disabled'    : this.options.disabled
        };
        this.$input = $('<input />', inputProps);

        // holds the suggestions
        var comboboxProps = {
          'class' : 'mi-suggestions dropdown-menu'
        };
        this.$combobox = $('<div />', comboboxProps);

        this.$container.append(this.$input);

        // replace all with new elements
        this.$formField.replaceWith(this.$container);
      },

      setupCombobox : function () {},

      registerObservers : function () {
        var self = this;
        this.$container.bind('keyup.magicinput', function (evt) {
          self.keyupChecker(evt);
        });
      },

      destroy : function () {},
    });

    return MagicInput;

  })(AbstractMagicInput);


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