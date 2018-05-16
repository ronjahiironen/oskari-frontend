Oskari.clazz.define('Oskari.statistics.statsgrid.IndicatorSelection', function (instance, sandbox) {
    this.instance = instance;
    this.sb = sandbox;
    this.service = sandbox.getService('Oskari.statistics.statsgrid.StatisticsService');
    this.spinner = Oskari.clazz.create('Oskari.userinterface.component.ProgressSpinner');
    this._params = Oskari.clazz.create('Oskari.statistics.statsgrid.IndicatorParameters', this.instance.getLocalization(), this.instance.getSandbox());
    this.element = null;
    Oskari.makeObservable(this);
}, {
    __templates: {
        main: _.template('<div class="statsgrid-ds-selections"></div>'),
        selections: _.template('<div class="statsgrid-indicator-selections"></div>'),
        select: _.template('<div class="selection">' +
            '<div class="title">${name}</div>' +
            '<div class=${clazz}>' +
            '</div>' +
            '</div>'),
        headerWithTooltip: _.template('<div class="selection tooltip">' +
            '<div class="title">${title}</div>' +
            '<div class="tooltip">${tooltip1}</div>' +
            '<div class="tooltip">${tooltip2}</div>' +
            '</div>'),
        option: _.template('<option value="${id}">${name}</option>')
    },
    /** **** PRIVATE METHODS ******/

    /**
     * @method  @private _populateIndicators populate indicators
     * @param  {Object} select  jQuery element of selection
     * @param  {Integer} datasrc datasource
     */
    _populateIndicators: function (select, datasrc, regionsetRestrictions) {
        var me = this;
        var errorService = me.service.getErrorService();
        var locale = Oskari.getMsg.bind(null, 'StatsGrid');

        if (!datasrc || datasrc === '') {
            return;
        }
        var hasRegionSetRestriction = regionsetRestrictions !== '' && regionsetRestrictions !== null;

        this.service.getIndicatorList(datasrc, function (err, result) {
            var results = [];
            if (err) {
                // notify error!!
                Oskari.log('Oskari.statistics.statsgrid.IndicatorSelection').warn('Error getting indicator list');
                errorService.show(locale('errors.title'), locale('errors.indicatorListError'));
                return;
            }
            var disabledIndicatorIDs = [];
            result.indicators.forEach(function (ind) {
                var resultObj = {
                    id: ind.id,
                    title: Oskari.getLocalized(ind.name)
                };
                results.push(resultObj);
                if (hasRegionSetRestriction) {
                    var doesntSupportRegionset = regionsetRestrictions.some(function (iter) {
                        return ind.regionsets.indexOf(Number(iter)) === -1;
                    });
                    if (doesntSupportRegionset) {
                        disabledIndicatorIDs.push(ind.id);
                    }
                }
            });
            var value = select.getValue();
            select.updateOptions(results);
            select.setValue(value);
            if (hasRegionSetRestriction) {
                select.disableOptions(disabledIndicatorIDs);
            }
            if (result.complete) {
                me.spinner.stop();

                if (result.indicators.length === 0) {
                    errorService.show(locale('errors.title'), locale('errors.indicatorListIsEmpty'));
                }
            }
        });
    },
    setElement: function (el) {
        this.element = el;
    },
    getElement: function () {
        return this.element;
    },
    createAddIndicatorButton: function (datasourceId) {
        var me = this;
        var btn = Oskari.clazz.create('Oskari.userinterface.component.Button');
        btn.setTitle(me.instance.getLocalization().userIndicators.buttonTitle);
        btn.setHandler(function (event) {
            event.stopPropagation();
            var formFlyout = me.instance.getFlyoutManager().getFlyout('indicatorForm');
            formFlyout.showForm(datasourceId);
        });
        return btn;
    },
    /** **** PUBLIC METHODS ******/

    /**
     * @method  @public getPanelContent get panel content
     * @return {Object} jQuery element
     */
    getPanelContent: function () {
        var me = this;
        var main = jQuery(this.__templates.main());
        var locale = me.instance.getLocalization();
        var panelLoc = locale.panels.newSearch;

        var datasources = this.service.getDatasource();
        var sources = [];
        datasources.forEach(function (ds) {
            var dataObj = {
                id: ds.id,
                title: ds.name
            };
            sources.push(dataObj);
        });
        // Datasources
        main.append(jQuery(this.__templates.select({name: locale.panels.newSearch.datasourceTitle, clazz: 'stats-ds-selector'})));
        // chosen works better when it has context for the element, get a new reference for chosen
        var dsSelector = main.find('.stats-ds-selector');
        var options = {
            placeholder_text: locale.panels.newSearch.selectDatasourcePlaceholder,
            allow_single_deselect: true,
            disable_search_threshold: 10,
            no_results_text: locale.panels.newSearch.noResults,
            width: '100%'
        };
        var dsSelect = Oskari.clazz.create('Oskari.userinterface.component.SelectList');
        var dropdown = dsSelect.create(sources, options);
        dropdown.css({width: '100%'});
        dsSelector.append(dropdown);
        dsSelect.adjustChosen();

        // Indicator list
        main.append(jQuery(this.__templates.select({name: locale.panels.newSearch.indicatorTitle, clazz: 'stats-ind-selector'})));
        // chosen works better when it has context for the element, get a new reference for chosen
        var indicatorSelector = main.find('.stats-ind-selector');
        me.spinner.insertTo(indicatorSelector);
        var indicOptions = {
            placeholder_text: locale.panels.newSearch.selectIndicatorPlaceholder,
            allow_single_deselect: true,
            disable_search_threshold: 10,
            no_results_text: locale.panels.newSearch.noResults,
            width: '100%',
            multi: true
        };
        var indicSelect = Oskari.clazz.create('Oskari.userinterface.component.SelectList');
        var indicDropdown = indicSelect.create(undefined, indicOptions);
        indicDropdown.css({width: '100%'});
        indicatorSelector.append(indicDropdown);
        indicSelect.adjustChosen();

        // Regionsets
        main.prepend(jQuery(this.__templates.select({name: locale.panels.newSearch.regionsetTitle, clazz: 'stats-rs-selector'})));
        var regionsetFilterElement = main.find('.stats-rs-selector');
        var regionOptions = {
            placeholder_text: locale.panels.newSearch.selectRegionsetPlaceholder,
            allow_single_deselect: true,
            disable_search_threshold: 10,
            no_results_text: locale.panels.newSearch.noResults,
            width: '100%',
            multi: true
        };

        var regionFilterSelect = Oskari.clazz.create('Oskari.userinterface.component.SelectList');
        var regionFilterDropdown = regionFilterSelect.create(this.service.getRegionsets(), regionOptions);
        regionFilterDropdown.css({width: '100%'});
        regionsetFilterElement.append(regionFilterDropdown);
        regionFilterSelect.adjustChosen();

        // Refine data label and tooltips
        var dataLabelWithTooltips = jQuery(this.__templates.headerWithTooltip({
            title: panelLoc.refineSearchLabel,
            tooltip1: panelLoc.refineSearchTooltip1 || '',
            tooltip2: panelLoc.refineSearchTooltip2 || ''
        }));
        main.append(dataLabelWithTooltips);

        // Refine data selections
        var selectionsContainer = jQuery(this.__templates.selections());
        main.append(selectionsContainer);
        me._params.attachTo(selectionsContainer);

        dsSelector.on('change', function () {
            me._params.clean();
            // If selection was removed -> reset indicator selection
            if (dsSelect.getValue() === '') {
                dataLabelWithTooltips.find('.tooltip').show();
                indicatorSelector.reset();
            } else {
                // else show spinner
                me.spinner.start();
            }

            me._populateIndicators(indicSelect, dsSelect.getValue(), regionFilterSelect.getValue());

            // if datasource is of type "user" the user can add new indicators to it
            if (me.service.getDatasource(Number(dsSelect.getValue())).type === 'user') {
                var btn = me.createAddIndicatorButton(dsSelect.getValue());
                btn.insertTo(me.getElement());
            }
        });

        indicatorSelector.on('change', function () {
            var indId = indicSelect.getValue();
            if (!indId || indId === '') {
                dataLabelWithTooltips.find('.tooltip').show();
                return;
            }
            me._params.indicatorSelected(
                dsSelect.getValue(),
                indicSelect.getValue(),
                regionFilterSelect.getValue());
        });

        regionsetFilterElement.on('change', function (evt) {
            var unsupportedSelections = me.getUnsupportedDatasetsList(regionFilterSelect.getValue());

            if (!regionFilterSelect.getValue()) {
                indicSelect.reset();
                dsSelect.reset();
            }
            me._params.indicatorSelected(dsSelect.getValue(), indicSelect.getValue(), regionFilterSelect.getValue());

            if (unsupportedSelections) {
                var ids = unsupportedSelections.map(function (iteration) {
                    return iteration.id;
                });
                dsSelect.disableOptions(ids);
            }

            var preselectSingleOption = function (select) {
                var state = select.getOptions();
                if (state.options.length - state.disabled.length === 1) {
                    var enabled = state.options.not(':disabled');
                    select.setValue(enabled.val());
                    select.element.trigger('change');
                }
            };
            preselectSingleOption(dsSelect);
            preselectSingleOption(indicSelect);
        });
        me._params.on('indicator.changed', function (enabled) {
            dataLabelWithTooltips.find('.tooltip').hide();
            me.trigger('indicator.changed', enabled);
        });

        this.service.on('StatsGrid.DatasourceEvent', function (evt) {
            var currentDS = dsSelect.getValue();
            if (currentDS !== evt.getDatasource()) {
                return;
            }
            // update indicator list
            me._populateIndicators(indicSelect, currentDS, regionFilterSelect.getValue());
        });
        me.setElement(main);
        return main;
    },
    getValues: function () {
        if (!this._params) {
            return {};
        }

        return this._params.getValues();
    },
    getIndicatorSelector: function () {
        var el = this.getElement();
        var indicSel = el.find('.stats-ind-selector');
        return indicSel;
    },
    /**
     * @method  @public  getUnsupportedDatasets
     * @description returns a list of unsupported datasources for the currently selected regionset(s)
     * @param regionsets regionsets
     */
    getUnsupportedDatasetsList: function (regionsets) {
        if (regionsets === null) {
            return;
        }
        var unsupportedDatasources = [];
        this.service.datasources.forEach(function (ds) {
            var unsupported = regionsets.some(function (iter) {
                return ds.regionsets.indexOf(Number(iter)) === -1;
            });
            if (unsupported) {
                unsupportedDatasources.push(ds);
            }
        });
        return unsupportedDatasources;
    }
});
