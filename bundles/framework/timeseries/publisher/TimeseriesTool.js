Oskari.clazz.define('Oskari.mapframework.bundle.timeseries.TimeseriesTool',
    function () {
    }, {
        index: 0,
        allowedLocations: ['top center'],
        lefthanded: 'top center',
        righthanded: 'top center',
        allowedSiblings: [],
        groupedSiblings: false,
        activeTimeseries: null,
        controlConfig: {
            showControl: true,
            location: 'top center',
            widthMargin: 200,
            topMargin: '90px'
        },
        /**
         * Initialize tool
         * @params {} state data
         * @method init
         * @public
         */
        init: function (pdata) {
            if (pdata && pdata.configuration && pdata.configuration.timeseries &&
                pdata.configuration.timeseries.conf &&
                pdata.configuration.timeseries.conf.plugins) {
                // Update control configuration according to app setup
                var plugin = pdata.configuration.timeseries.conf.plugins.find(function (plugin) {
                    return plugin.id === 'Oskari.mapframework.bundle.timeseries.TimeseriesControlPlugin';
                });
                if (plugin) {
                    this.controlConfig = plugin.config;
                }
            }
            // Apply configuration
            this.setEnabled(this.controlConfig.showControl);
        },
        _getTimeseriesService: function () {
            if (!this.service) {
                this.service = this.__sandbox.getService('Oskari.mapframework.bundle.timeseries.TimeseriesService');
            }
            return this.service;
        },
        /**
         * Sends configuration request to timeseries module
         *
         * @method _updateTimeseriesPluginConfig
         * @private
         */
        _updateTimeseriesPluginConfig: function () {
            var requestBuilder = Oskari.requestBuilder('Timeseries.ConfigurationRequest');
            this.__sandbox.request('Publisher2', requestBuilder(this.controlConfig));
        },
        /**
        * Get tool object.
        * @method getTool
        * @private
        *
        * @returns {Object} tool
        */
        getTool: function () {
            return {
                id: 'Oskari.mapframework.bundle.timeseries.TimeseriesControlPlugin',
                title: 'TimeseriesControlPlugin'
            };
        },
        /**
        * Set enabled.
        * @method setEnabled
        * @public
        *
        * @param {Boolean} enabled is tool enabled or not
        */
        setEnabled: function (enabled) {
            this.state.enabled = enabled;

            // Set control visibility by updating it's config.
            this.controlConfig.showControl = enabled;
            this._updateTimeseriesPluginConfig();

            // Apply changed configuration.
            var active = this._getTimeseriesService().getActiveTimeseries();
            this.service.trigger('activeChanged', active);

            var event = Oskari.eventBuilder('Publisher2.ToolEnabledChangedEvent')(this);
            this.__sandbox.notifyAll(event);
        },
        /**
        * Is displayed.
        * @method isDisplayed
        * @public
        *
        * @returns {Boolean} is tool displayed
        */
        isDisplayed: function (data) {
            return typeof this._getTimeseriesService().getActiveTimeseries() !== 'undefined';
        },
        /**
        * Get values.
        * @method getValues
        * @public
        *
        * @returns {Object} tool value object
        */
        getValues: function () {
            var me = this;

            if (me.state.enabled) {
                return {
                    configuration: {
                        timeseries: {
                            conf: {
                                plugins: [{ id: this.getTool().id, config: this.controlConfig }]
                            }
                        }
                    }
                };
            } else {
                // Don't include timeseries at all
                return null;
            }
        },
        /**
        * Stop tool.
        * @method stop
        * @public
        */
        stop: function () {
            if (this.controlConfig) {
                this.controlConfig = null;
                this._updateTimeseriesPluginConfig();
                var active = this._getTimeseriesService().getActiveTimeseries();
                this.service.trigger('activeChanged', active);
            }
        }
    }, {
        'extend': ['Oskari.mapframework.publisher.tool.AbstractPluginTool'],
        'protocol': ['Oskari.mapframework.publisher.Tool']
    }
);