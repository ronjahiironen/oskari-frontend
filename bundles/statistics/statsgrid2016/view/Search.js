Oskari.clazz.define('Oskari.statistics.statsgrid.view.Search', function (instance, flyout) {
    this.instance = instance;
    this.container = null;
    this.flyout = flyout;
}, {
    setElement: function ( el ) {
        this.container = el;
    },
    getElement: function () {
        return this.container;
    },
    clearUi: function () {
        if( this.container === null ) {
            return;
        }
            this.container.empty();
    },
    /**
     * @method lazyRender
     * Called when flyout is opened (by instance)
     * Creates the UI for a fresh start.
     */
    createUi: function (isEmbedded) {
        var locale = this.instance.getLocalization();
        // empties all
        this.clearUi();
        this.setElement( jQuery( '<div class="statsgrid-search-container"></div>' ) );
        var title = locale.flyout.title;
        var parent = this.getElement().parent().parent();
        if(isEmbedded) {
            parent.find('.oskari-flyout-title p').html(title);
            // Remove close button from published
            parent.find('.oskari-flyouttools').hide();
        } else {
            // resume defaults (important if user used publisher)
            parent.find('.oskari-flyout-title p').html(title);
            parent.find('.oskari-flyouttools').show();
        }
        this.showLegend(!isEmbedded);
        this.addContent(this.getElement(), isEmbedded);
    },
    addContent : function (el, isEmbedded) {
        var me = this;
        var sb = this.instance.getSandbox();

        var accordion = Oskari.clazz.create(
                'Oskari.userinterface.component.Accordion'
            );
        var panels = this.getPanels(isEmbedded);
        var service = sb.getService('Oskari.statistics.statsgrid.StatisticsService');
        var state = service.getStateService();
        var openFirstPanel = state.getIndicators().length === 0;

        _.each(panels, function(p) {
            if(p.id === 'newSearchPanel' && openFirstPanel) {
                p.panel.open();
            }
            accordion.addPanel(p.panel);
        });

        accordion.insertTo(el);
    },
    closePanels: function() {
        var panels = this.__panels || [];
        _.each(panels, function(p) {
            p.panel.close();
        });
    },
    getPanels : function(isEmbedded) {
        var panels = [];
        if(isEmbedded) {
            // no panels for embedded map
            return panels;
        }

        panels.push(this.getNewSearchPanel());
        panels.push(this.getExtraFeaturesPanel());
        return panels;
    },
    getNewSearchPanel: function(){
        var sb = this.instance.getSandbox();
        var panel = Oskari.clazz.create('Oskari.userinterface.component.AccordionPanel');
        var container = panel.getContainer();
        var locale = this.instance.getLocalization();

        panel.setTitle(locale.panels.newSearch.title);

        var selectionComponent = Oskari.clazz.create('Oskari.statistics.statsgrid.IndicatorSelection', this.instance, sb);
        container.append(selectionComponent.getPanelContent());

        return {id:'newSearchPanel', panel:panel};
    },
    getExtraFeaturesPanel: function(){
        var sb = this.instance.getSandbox();
        var panel = Oskari.clazz.create('Oskari.userinterface.component.AccordionPanel');
        var container = panel.getContainer();
        var locale = this.instance.getLocalization();

        panel.setTitle(locale.panels.extraFeatures.title);
        container.append(Oskari.clazz.create('Oskari.statistics.statsgrid.ExtraFeatures', sb, locale.panels.extraFeatures).getPanelContent());

        return {id:'extraFeaturesPanel', panel:panel};
    },
     getLegendFlyout : function() {
        if(this.__legendFlyout) {
            return this.__legendFlyout;
        }
        var locale = this.instance.getLocalization().legend;
        var flyout = Oskari.clazz.create('Oskari.userinterface.extension.ExtraFlyout', locale.title, {
            width: 'auto',
            cls: 'statsgrid-legend-flyout'
        });
        flyout.makeDraggable({
            handle : '.oskari-flyouttoolbar, .statsgrid-legend-container > .header',
            scroll : false
        });
        this.__legendFlyout = flyout;
        // render content
        this.__legend = Oskari.clazz.create('Oskari.statistics.statsgrid.Legend', this.instance.getSandbox(), this.instance.getLocalization());
        var container = jQuery('<div/>');
        this.__legend.render(container);
        flyout.setContent(container);
        return this.__legendFlyout;
    },
    showLegend : function(enabled) {
        var me = this;
        if(!enabled) {
            me.flyout.removeSideTools();
            return;
        }
        var locale = this.instance.getLocalization();
        me.flyout.addSideTool(locale.legend.title, function(el, bounds) {
            // lazy render
            var flyout = me.getLegendFlyout();
            if(flyout.isVisible()) {
                flyout.hide();
            } else {
                // show and reset position
                flyout.move(bounds.right, bounds.top, true);
                // init legend panel open when the flyout is opened
                me.__legend.openLegendPanel();
                flyout.show();
                flyout.bringToTop();
            }
        });
    }
}, {

});