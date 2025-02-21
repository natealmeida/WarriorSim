const MAX_WORKERS = ~~Math.min(8, (navigator.hardwareConcurrency || 8) / 2);
const WEB_DB_URL = "https://classic.wowhead.com/";

var SIM = SIM || {}

SIM.UI = {

    init: function () {
        var view = this;
        view.variables();
        view.events();
        view.initLog();
        view.loadSession();
        view.loadWeapons("mainhand");
        view.updateSidebar();
        view.main.find('.js-import').hide();
        view.main.find('.js-export').hide();

        view.body.on('click', '.wh-tooltip, .tablesorter-default a', function (e) {
            e.preventDefault();
        });

    },

    variables: function () {
        var view = this;
        view.body = $('body');
        view.buffs = view.body.find('article.buffs');
        view.fight = view.body.find('article.fight');
        view.rotation = view.body.find('article.rotation');
        view.talents = view.body.find('article.talents');
        view.runes = view.body.find('article.runes');
        view.filter = view.body.find('article.filter');
        view.main = view.body.find('section.main');
        view.sidebar = view.body.find('section.sidebar');
        view.tcontainer = view.main.find('.table-container');
        view.alerts = view.body.find('.alerts');
        view.progress = view.main.find('progress');
    },

    events: function () {
        var view = this;

        view.sidebar.find('.js-settings').click(function (e) {
            e.preventDefault();
            $(this).toggleClass('active');
            window.scrollTo(0, 0);
            $('section.settings').css('min-height', view.body.outerHeight() + 'px');
            $('section.settings').toggleClass('active');
            view.sidebar.find('.js-stats').removeClass('active');
            view.sidebar.find('.js-profiles').removeClass('active');
            view.sidebar.find('.js-matrix').removeClass('active');
            $('section.stats').removeClass('active');
            $('section.profiles').removeClass('active');
            $('section.matrix').removeClass('active');
            view.body.removeClass('sidebar-mobile-open');
        });

        view.sidebar.find('.js-profiles').click(function (e) {
            e.preventDefault();
            $(this).toggleClass('active');
            window.scrollTo(0, 0);
            $('section.profiles').css('min-height', view.body.outerHeight() + 'px');
            $('section.profiles').toggleClass('active');
            view.sidebar.find('.js-stats').removeClass('active');
            view.sidebar.find('.js-settings').removeClass('active');
            view.sidebar.find('.js-matrix').removeClass('active');
            $('section.stats').removeClass('active');
            $('section.settings').removeClass('active');
            $('section.matrix').removeClass('active');
            view.body.removeClass('sidebar-mobile-open');
            SIM.PROFILES.buildProfiles();
        });

        view.sidebar.find('.js-dps').click(function (e) {
            e.preventDefault();
            view.disableEditMode();
            view.startLoading();
            view.simulateDPS();
        });

        view.sidebar.find('.js-weights').click(function (e) {
            e.preventDefault();
            view.disableEditMode();
            view.startLoading();
            view.simulateDPS("stats");
        });

        view.sidebar.find('.js-stats').click(function (e) {
            e.preventDefault();
            $(this).toggleClass('active');
            window.scrollTo(0, 0);
            $('section.stats').css('min-height', view.body.outerHeight() + 'px');
            $('section.stats').toggleClass('active');
            view.sidebar.find('.js-settings').removeClass('active');
            view.sidebar.find('.js-profiles').removeClass('active');
            view.sidebar.find('.js-matrix').removeClass('active');
            $('section.settings').removeClass('active');
            $('section.profiles').removeClass('active');
            $('section.matrix').removeClass('active');
            view.body.removeClass('sidebar-mobile-open');
        });

        view.sidebar.find('.js-matrix').click(function (e) {
            e.preventDefault();
            $(this).toggleClass('active');
            window.scrollTo(0, 0);
            $('section.matrix').css('min-height', view.body.outerHeight() + 'px');
            $('section.matrix').toggleClass('active');
            view.sidebar.find('.js-settings').removeClass('active');
            view.sidebar.find('.js-profiles').removeClass('active');
            view.sidebar.find('.js-stats').removeClass('active');
            $('section.settings').removeClass('active');
            $('section.profiles').removeClass('active');
            $('section.stats').removeClass('active');
            view.body.removeClass('sidebar-mobile-open');
        });

        view.body.on('click', '.js-table', function(e) {
            e.preventDefault();
            view.disableEditMode();
            const rows = view.tcontainer.find('table.gear tbody tr');
            rows.addClass('waiting');
            view.tcontainer.find('table.gear tbody tr td:last-of-type').html('');
            view.startLoading();
            view.simulateDPS(rows);

            // mobile
            view.sidebar.addClass('closed');
            view.sidebar.find('.menu-button-container').removeClass('open');
            if (window.innerWidth < 960) view.sidebar.get(0).scrollTop = 0;
            view.body.removeClass('sidebar-mobile-open');
        });

        view.main.on('click', '.js-enchant', function(e) {
            e.preventDefault();
            view.disableEditMode();
            const rows = view.tcontainer.find('table.enchant tbody tr');
            rows.addClass('waiting');
            view.tcontainer.find('table.enchant tbody tr td:last-of-type').html('');
            view.startLoading();
            view.simulateDPS(rows);
        });

        view.main.on('click', '.js-editmode', function(e) {
            e.preventDefault();
            $(this).toggleClass('active');
            window.scrollTo(0, 0);
            let active = $(this).hasClass('active');
            if (active) view.enableEditMode();
            else view.disableEditMode();
        });

        view.main.on('click', '.js-export', function(e) {
            e.preventDefault();
            view.exportProfile();
        });

        view.main.on('click', '.js-import', function(e) {
            e.preventDefault();
            view.importProfile();
        });

        view.main.find('nav li a').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
        });

        view.main.find('nav li p, nav li img').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            let li = $(this).parents('li');
            li.addClass('active');
            li.siblings().removeClass('active');
            var type = li.data('type');
            let subtype = false;
            if (!type) {
                type = li.parents('[data-type]').data('type');
                subtype = true;
            }

            view.main.find('.js-editmode').show();
            view.main.find('.js-table').show();
            view.main.find('.js-import').hide();
            view.main.find('.js-export').hide();

            if (type == "mainhand" || type == "offhand" || type == "twohand")
                view.loadWeapons(type);
            else if (type == "custom")
                view.loadCustom();
            else
                view.loadGear(type);
        });

        view.tcontainer.on('click', 'table.gear td:not(.ppm)', function(e) {
            e.preventDefault();
            var table = $(this).parents('table');
            var type = table.data('type');
            var max = table.data('max');
            var tr = $(this).parent();

            if (table.hasClass('editmode')) {
                if (tr.hasClass('hidden'))
                    view.rowShowItem(tr);
                else
                    view.rowHideItem(tr);
                return;
            }

            if (tr.hasClass('active')) {
                view.rowDisableItem(tr);
            }
            else {
                var counter = table.find('tr.active').length;
                if (counter >= max) view.rowDisableItem(table.find('tr.active').last());
                view.rowEnableItem(tr);
            }

            view.updateSession();
            view.updateSidebar();
            SIM.SETTINGS.buildSpells();
        });

        view.tcontainer.on('click', 'table.enchant td:not(.ppm)', function(e) {
            e.preventDefault();
            var table = $(this).parents('table');
            var tr = $(this).parent();
            var temp = tr.data('temp');

            if (table.hasClass('editmode')) {
                if (tr.hasClass('hidden'))
                    view.rowShowEnchant(tr);
                else
                    view.rowHideEnchant(tr);
                return;
            }

            if (tr.hasClass('active')) {
                view.rowDisableEnchant(tr);
            }
            else {
                let disable = table.find('tr.active[data-temp="' + temp + '"]').first();
                if (disable.length) view.rowDisableEnchant(disable);
                view.rowEnableEnchant(tr);
            }

            view.updateSession();
            view.updateSidebar();
            SIM.SETTINGS.buildSpells();
        });

        view.runes.on('click', '.rune .icon', function(e) {
            e.preventDefault();
            var current_open_page =  $(`nav`).children('ul').children('li.active').data('type');
            var rune_type = $(this).closest('tr[name]').attr('name');
            var rune_id = $(this).parent().attr('data-id').toString();;
            view.loadGear(rune_type);
            var parent = view.tcontainer.find($(`.runes[data-type="${rune_type}"]`));
            var rune = parent.find($(`[data-id="${rune_id}"]`));
            if (rune.hasClass('active')) {
                view.rowDisableRunes(rune);
            } else {
                parent.children('div').each(function(index, element) {
                    view.rowDisableRunes($(element));
                });
                view.rowEnableRunes(rune);
            }
            view.updateSession();
            view.updateSidebar();
            SIM.SETTINGS.buildSpells();
            SIM.SETTINGS.buildBuffs();

            if (current_open_page == "mainhand" || current_open_page == "offhand" || current_open_page == "twohand")
                view.loadWeapons(current_open_page);
            else if (current_open_page == "custom")
                view.loadCustom();
            else 
                view.loadGear(current_open_page);
        });

        view.tcontainer.on('click', '.runes .icon', function(e) {
            e.preventDefault();
            var parent = $(this).parents('.runes');
            var rune = $(this).parent();

            if (rune.hasClass('active')) {
                view.rowDisableRunes(rune);
            }
            else {
                let disable = parent.find('.rune.active').first();
                if (disable.length) view.rowDisableRunes(disable);
                view.rowEnableRunes(rune);
            }

            view.updateSession();
            view.updateSidebar();
            SIM.SETTINGS.buildSpells();
            SIM.SETTINGS.buildBuffs();
        });

        view.sidebar.find('.menu-button-container').click(function (e) {
            e.preventDefault();
            $(this).parents('.sidebar').toggleClass('closed');
            $(this).parents('.sidebar').get(0).scrollTop = 0;
            $(this).toggleClass('open');
            view.body.toggleClass('sidebar-mobile-open');
        });

        view.tcontainer.on('keyup', 'input[name="search"]', function (e) {
            e.preventDefault();
            if (e.key == "Escape") $(this).val('');
            let val = $(this).val();
            view.tcontainer.find('.gear td:nth-child(2)').each(function() {
                let td = $(this).get(0);
                if (!val || td.textContent.toLowerCase().indexOf(val.toLowerCase()) > -1) td.parentElement.classList.remove('filtered');
                else td.parentElement.classList.add('filtered');
            });
        });

        view.tcontainer.on('click', '.filters label', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('active');
            globalThis[$(this).attr('id')] = $(this).hasClass('active');
            view.updateSession();
            view.filterGear();
        });

    },

    enableEditMode: function() {
        var view = this;
        let type = view.tcontainer.find('table.gear').attr('data-type');
        if (type == "mainhand" || type == "offhand" || type == "twohand")
            view.loadWeapons(type, true);
        else if (type == "custom")
            view.loadCustom(true);
        else
            view.loadGear(type, true);
    },

    disableEditMode: function() {
        var view = this;
        view.main.find('.js-editmode').removeClass('active');
        let type = view.tcontainer.find('table.gear').attr('data-type');
        if (type == "mainhand" || type == "offhand" || type == "twohand")
            view.loadWeapons(type, false);
        else if (type == "custom")
            view.loadCustom(false);
        else
            view.loadGear(type, false);
    },

    simulateDPS: function(rows) {
        let view = this;
        if (rows && rows.length == 0) {
            view.endLoading();
            return;
        }
        console.clear()
        let dps = view.sidebar.find('.dps');
        let error = view.sidebar.find('#dpserr');
        let stats = view.sidebar.find('#stats');
        let time = view.sidebar.find('#time');
        let btn = view.sidebar.find('.js-dps');
        view.sidebar.find('#weights-div').css('display', '');
        let weights = (rows === "stats");
        if (weights) {
            rows = undefined;
        }
        dps.text('');
        error.text('');
        time.text('');
        const params = {
            player: [undefined, undefined, undefined, Player.getConfig()],
            sim: Simulation.getConfig(),
            fullReport: true,
        };
        if (rows) {
            let type = rows.parents('table').data('type');
            if (type == "finger" || type == "trinket" || type == "custom")
                params.player = [null, type, undefined, Player.getConfig()];
        }
        player = new Player(...params.player);
        if (!player.mh) {
            view.addAlert('No weapon selected');
            view.endLoading();
            return;
        }
        var sim = new SimulationWorkerParallel(
            MAX_WORKERS,
            (report) => {
                // Finished
                // Technically, it is incorrect to calculate mean DPS like this, since fight duration varies...
                const mean = report.totaldmg / report.totalduration;
                dps.text(mean.toFixed(2));

                const s1 = report.sumdps, s2 = report.sumdps2, n = report.iterations;
                const varmean = (s2 - s1 * s1 / n) / (n - 1) / n;
                error.text((1.96 * Math.sqrt(varmean)).toFixed(2));

                time.text((report.endtime - report.starttime) / 1000);
                stats.html(report.mindps.toFixed(2) + ' min&nbsp;&nbsp;&nbsp;&nbsp;' + report.maxdps.toFixed(2) + ' max');
                btn.css('background', '');
                if (rows) view.simulateRows(Array.from(rows));
                else if (weights) view.simulateWeights(player, mean, varmean);
                else view.endLoading();

                SIM.STATS.initCharts(report);
                sim = null;
                player = null;

            },
            (iteration, report) => {
                // Update
                let perc = parseInt(iteration / report.iterations * 100);
                dps.text((report.totaldmg / report.totalduration).toFixed(2));
                btn.css('background', 'linear-gradient(to right, transparent ' + perc + '%, #444 ' + perc + '%)');
            },
            (error) => {
                dps.text('ERROR');
                console.error(error);
            },
        );
        sim.start(params);
    },

    simulateWeights: function(player, mean, varmean) {
        const view = this;
        const btn = view.sidebar.find('.js-weights');
        const totalTasks = (player.auras.bloodfury ? 4 : 3);
        view.sidebar.find('#weights-div').css('display', 'block');
        view.sidebar.find('#weights-div > div').addClass('loading').append('<span class="spinner"><span class="bounce1"></span><span class="bounce2"></span><span class="bounce3"></span></span>');
        let tasksDone = 0;
        function updateFn(progress) {
            const perc = parseInt(100 * (tasksDone + progress) / totalTasks);
            btn.css('background', 'linear-gradient(to right, transparent ' + perc + '%, #444 ' + perc + '%)');
        }
        const simulateWeight = (stat, amount) => this.simulateStat(stat, amount, updateFn).then(result => {
            tasksDone += 1;
            return {weight: (result.mean - mean) / amount, error: 1.96 * Math.sqrt(varmean + result.varmean) / amount};
        });
        function updateStat(name, {weight, error}) {
            const line = view.sidebar.find('#weight-' + name);
            line.removeClass('loading').find('.spinner').remove();
            line.find('.stat-dps').text(weight.toFixed(2));
            line.find('.stat-error').text(error.toFixed(2));
        }
        async function simulateAll() {
            updateStat("agi", await simulateWeight(4, 20));
            updateStat("str", await simulateWeight(3, 20));
            updateStat("ap", await simulateWeight(0, 40));
            updateStat("crit", await simulateWeight(1, 1));
            updateStat("hit", await simulateWeight(2, 1));
        }

        simulateAll().then(
            () => {
                btn.css('background', '');
                view.endLoading();
            },
            error => {
                btn.css('background', '');
                view.sidebar.find('.dps').text('ERROR');
                view.sidebar.find('#dpserr').text('');
                view.endLoading();
                console.error(error);
            },
        );
    },

    simulateStat: function(stat, amount, updateFn) {
        return new Promise((resolve, reject) => {
            const params = {
                player: [amount, stat, 3, Player.getConfig()],
                sim: Simulation.getConfig(),
            };
            var sim = new SimulationWorkerParallel(
                MAX_WORKERS,
                (report) => {
                    const mean = report.totaldmg / report.totalduration;

                    const s1 = report.sumdps, s2 = report.sumdps2, n = report.iterations;
                    const varmean = (s2 - s1 * s1 / n) / (n - 1) / n;

                    resolve({mean, varmean});
                },
                (iteration, report) => {
                    if (updateFn) updateFn(iteration / report.iterations, report.totaldmg / report.totalduration);
                },
                (error) => reject(error),
            );
            sim.start(params);
        });
    },

    simulateRows: function(rows) {
        var view = this;
        var btn = view.sidebar.find('.js-table');

        const simulations = rows.map((row) => {
            const simulation = { perc: 0 };
            simulation.run = () => {
                // Remove from pending simulations
                pending.delete(simulation);

                // Start simulation
                this.simulateRow($(row), (perc) => {
                    // Update row percentage
                    simulation.perc = perc;

                    // Update total percentage
                    const total = Math.floor(
                        Array.from(simulations.values())
                            .map((sim) => sim.perc)
                            .reduce((a, b) => a + b, 0) / rows.length
                    );
                    if (total == 100) {
                        btn.css('background', '');
                        view.endLoading();
                        view.updateSession();
                    } else {
                        btn.css('background', 'linear-gradient(to right, transparent ' + total + '%, #444 ' + total + '%)');
                    }

                    // If simulation complete, run another pending simulation (if any)
                    if (simulation.perc == 100) {
                        const next = pending.values().next().value;
                        if (next) {
                            next.run();
                        }
                    }
                });
            };
            return simulation;
        });
        const pending = new Set(simulations);

        for (const simulation of simulations.slice(0, MAX_WORKERS)) {
            simulation.run();
        }
    },

    simulateRow: function(tr, updateFn) {
        var view = this;
        var dps = tr.find('td:last-of-type');
        var type = tr.parents('table').data('type');
        var item = tr.data('id');
        var isench = tr.parents('table').hasClass('enchant');
        var istemp = tr.data('temp') == true;
        var base = parseFloat(view.sidebar.find('.dps').text());

        const params = {
            player: [item, type, istemp ? 2 : isench ? 1 : 0, Player.getConfig()],
            sim: Simulation.getConfig(),
        };
        var sim = new SimulationWorker(
            (report) => {
                // Finished
                let span = $('<span></span>');
                let calc = report.totaldmg / report.totalduration;
                let diff = calc - base;
                span.text(diff.toFixed(2));
                if (diff >= 0) span.addClass('p');
                else span.addClass('n');
                dps.text(calc.toFixed(2)).append(span);

                view.tcontainer.find('table').each(function() {
                    if (type == "custom") return;
                    $(this).trigger('update');
                    let sortList = [[$(this).find('th').length - 1, 1]];
                    $(this).trigger("sorton", [sortList]);
                });

                tr.removeClass('waiting');
                updateFn(100);
                sim = null;

                if (isench) {
                    for(let i of enchant[type])
                        if (i.id == item)
                            i.dps = calc.toFixed(2);
                }
                else {
                    for(let i of gear[type])
                        if (i.id == item)
                            i.dps = calc.toFixed(2);
                }
            },
            (iteration, report) => {
                // Update
                let perc = Math.floor((iteration / report.iterations) * 100);
                if (perc < 100) {
                    updateFn(perc);
                    dps.text((report.totaldmg / report.totalduration).toFixed(2));
                }
            },
            (error) => {
                dps.text('ERROR');
                console.error(error);
            },
        );
        sim.start(params);
    },

    rowDisableItem: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.removeClass('active');
        for(let i = 0; i < gear[type].length; i++) {
            if (gear[type][i].id == tr.data('id'))
                gear[type][i].selected = false;
        }
    },

    rowEnableItem: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.addClass('active');
        for(let i = 0; i < gear[type].length; i++) {
            if (gear[type][i].id == tr.data('id'))
                gear[type][i].selected = true;
            else if (type != "finger" && type != "trinket" && type != "custom")
                gear[type][i].selected = false;
        }

        if (type == "twohand") {
            for(let i = 0; i < gear.mainhand.length; i++)
                gear.mainhand[i].selected = false;
            for(let i = 0; i < gear.offhand.length; i++)
                gear.offhand[i].selected = false;
            for(let i = 0; i < enchant.mainhand.length; i++)
                enchant.mainhand[i].selected = false;
            for(let i = 0; i < enchant.offhand.length; i++)
                enchant.offhand[i].selected = false;
        }

        if (type == "mainhand" || type == "offhand") {
            for(let i = 0; i < gear.twohand.length; i++)
                gear.twohand[i].selected = false;
            for(let i = 0; i < enchant.twohand.length; i++)
                enchant.twohand[i].selected = false;
        }

        for(let i = 0; i < spells.length; i++) {
            if (spells[i].item && spells[i].id == tr.data('id') && !spells[i].timetoendactive && !spells[i].timetostartactive) {
                // Blademasters Fury
                if (spells[i].id == 219223) spells[i].active = true;
                else spells[i].timetoendactive = true;
            }
        }
    },

    rowHideItem: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.removeClass('active');
        tr.addClass('hidden');
        tr.find('.hide').html(eyesvghidden);
        for(let i = 0; i < gear[type].length; i++) {
            if (gear[type][i].id == tr.data('id')) {
                gear[type][i].hidden = true;
                gear[type][i].selected = false;
            }
        }
    },

    rowShowItem: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.removeClass('hidden');
        tr.find('.hide').html(eyesvg);
        for(let i = 0; i < gear[type].length; i++) {
            if (gear[type][i].id == tr.data('id'))
                gear[type][i].hidden = false;
        }
    },

    rowDisableEnchant: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.removeClass('active');
        for(let i = 0; i < enchant[type].length; i++) {
            if (enchant[type][i].id == tr.data('id'))
                enchant[type][i].selected = false;
        }
    },

    rowEnableEnchant: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.addClass('active');
        for(let i = 0; i < enchant[type].length; i++) {
            if (enchant[type][i].id == tr.data('id'))
                enchant[type][i].selected = true;
        }
    },

    rowHideEnchant: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.removeClass('active');
        tr.addClass('hidden');
        tr.find('.hide').html(eyesvghidden);
        for(let i = 0; i < enchant[type].length; i++) {
            if (enchant[type][i].id == tr.data('id')) {
                enchant[type][i].hidden = true;
                enchant[type][i].selected = false;
            }
        }
    },

    rowShowEnchant: function(tr) {
        var table = tr.parents('table');
        var type = table.data('type');
        tr.removeClass('hidden');
        tr.find('.hide').html(eyesvg);
        for(let i = 0; i < enchant[type].length; i++) {
            if (enchant[type][i].id == tr.data('id'))
                enchant[type][i].hidden = false;
        }
    },

    rowDisableRunes: function(div) {
        var parent = div.parents('.runes');
        var type = parent.data('type');
        div.removeClass('active');
        for(let i = 0; i < runes[type].length; i++) {
            if (runes[type][i].id == div.data('id')) {
                runes[type][i].selected = false;
                if (runes[type][i].enable) {
                    for (let spell of spells)
                        if (spell.id == runes[type][i].enable)
                            spell.active = false;
                    for (let buff of buffs) {
                        if (buff.id == runes[type][i].enable) 
                            buff.active = false;
                        if (buff.id == 2458 && runes[type][i].gladstance) 
                            buff.active = true;
                    }
                        
                }
            }
               
        }
        var settings_parent = this.body.find('article.runes');
        var rune_lookup = $(`tr[name="${type}"]`);
        settings_parent.find(rune_lookup).find('div').removeClass('active');
    },

    rowEnableRunes: function(div) {
        var parent = div.parents('.runes');
        var type = parent.data('type');
        div.addClass('active');
        let this_spell_id = 0;
        for(let i = 0; i < runes[type].length; i++) {
            if (runes[type][i].id == div.data('id')) {
                runes[type][i].selected = true;
                if (runes[type][i].enable) {
                    for (let spell of spells)
                        if (spell.id == runes[type][i].enable)
                            spell.active = true;
                    for (let buff of buffs) {
                        if (buff.id == runes[type][i].enable)
                            buff.active = true;
                        if (runes[type][i].buffgroup && buff.group == runes[type][i].buffgroup && buff.id !== runes[type][i].enable)
                            buff.active = false;
                    }
                }
                this_spell_id = runes[type][i].id;
            }
        }
        var settings_parent = this.body.find('article.runes');
        var rune_lookup = $(`[data-id="${this_spell_id}"]`);
        settings_parent.find(rune_lookup).children('div').addClass('active');
    },

    startLoading: function() {
        let btns = $('.js-dps, .js-weights, .js-table, .js-enchant');
        btns.addClass('loading');
        btns.append('<span class="spinner"><span class="bounce1"></span><span class="bounce2"></span><span class="bounce3"></span></span>');
        $('section.main nav').addClass('loading');
    },

    endLoading: function() {
        let btns = $('.js-dps, .js-weights, .js-table, .js-enchant');
        btns.removeClass('loading');
        btns.find('.spinner').remove();
        $('section.main nav').removeClass('loading');
    },

    updateSidebar: function () {
        var view = this;
        var player = new Player();
        let storage = JSON.parse(localStorage[mode + (globalThis.profileid || 0)]);

        let space = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
        view.updatePaperdoll();
        if (!player.mh) return;
        view.sidebar.find('#str').text(player.stats.str);
        view.sidebar.find('#agi').text(player.stats.agi);
        view.sidebar.find('#ap').text(player.stats.ap);
        view.sidebar.find('#skill').html(player.stats['skill_' + player.mh.type] + ' <small>MH</small>' + (player.oh ? space + player.stats['skill_' + player.oh.type] + ' <small>OH</small>' : ''));
        view.sidebar.find('#hit').html((player.stats.hit || 0) + '%');
        view.sidebar.find('#miss').html(Math.max(player.mh.miss, 0).toFixed(2) + '% <small>1H</small>' + (player.oh ? space + Math.max(player.mh.dwmiss, 0).toFixed(2) + '% <small>DW</small>' : ''));
        view.sidebar.find('#dodge').html(player.mh.dodge.toFixed(2) + '% <small>MH</small>' + (player.oh ? space + player.oh.dodge.toFixed(2) + '% <small>OH</small>' : ''));
        let mhcrit = player.crit + player.mh.crit;
        let ohcrit = player.crit + (player.oh ? player.oh.crit : 0);
        view.sidebar.find('#crit').html(mhcrit.toFixed(2) + '% <small>MH</small>' + (player.oh ? space + ohcrit.toFixed(2) + '% <small>OH</small>' : ''));
        let mhcap = Math.max(0, 100 - player.mh.dwmiss - player.mh.dodge - player.mh.glanceChance);
        let ohcap = Math.max(0, player.oh ? 100 - player.oh.dwmiss - player.oh.dodge - player.oh.glanceChance : 0);
        view.sidebar.find('#critcap').html(mhcap.toFixed(2) + '% <small>MH</small>'+ (player.oh ? space + ohcap.toFixed(2) + '% <small>OH</small>' : ''));
        let mhdmg = player.stats.dmgmod * player.mh.modifier * 100;
        let ohdmg = player.stats.dmgmod * (player.oh ? player.oh.modifier * 100 : 0);
        view.sidebar.find('#dmgmod').html(mhdmg.toFixed(2) + '% <small>MH</small>' + (player.oh ? space + ohdmg.toFixed(2) + '% <small>OH</small>' : ''));
        view.sidebar.find('#haste').html((player.stats.haste * 100).toFixed(2) + '%');
        view.sidebar.find('#shadow-resist').html(player.stats.resist.shadow);
        view.sidebar.find('#arcane-resist').html(player.stats.resist.arcane);
        view.sidebar.find('#nature-resist').html(player.stats.resist.nature);
        view.sidebar.find('#fire-resist').html(player.stats.resist.fire);
        view.sidebar.find('#frost-resist').html(player.stats.resist.frost);
        view.sidebar.find('#race').text(storage.race);
        view.sidebar.find('#level').text(storage.level);
        view.sidebar.find('#sets').empty();

        for (let set of sets) {
            let counter = 0;
            for (let item of set.items)
                if (player.items.includes(item))
                    counter++;
            if (counter == 0)
                continue;
            if (counter >= set.bonus[0].count)
                view.sidebar.find('#sets').append(`<a href="${WEB_DB_URL}item-set=${set.id}" class="q4">${set.name} (${counter})</a><br />`);
        }

        let count = 0;
        for (let tree of talents)
            for (let talent of tree.t)
                count += talent.c;
        view.talents.find("#points").text(Math.max(player.level - 9 - count, 0));
    },

    updatePaperdoll: function() {
        const view = this;
        let icons = {
            mainhand: 'inventoryslot_mainhand',
            offhand: 'inventoryslot_offhand',
            twohand: 'inventoryslot_mainhand',
            ranged: 'inventoryslot_ranged',
            head: 'inventoryslot_head',
            neck: 'inventoryslot_neck',
            shoulder: 'inventoryslot_shoulder',
            back: 'inventoryslot_chest',
            chest: 'inventoryslot_chest',
            wrist: 'inventoryslot_wrists',
            hands: 'inventoryslot_hands',
            waist: 'inventoryslot_waist',
            legs: 'inventoryslot_legs',
            feet: 'inventoryslot_feet',
            finger1: 'inventoryslot_finger',
            finger2: 'inventoryslot_finger',
            trinket1: 'inventoryslot_trinket',
            trinket2: 'inventoryslot_trinket',
        }
        for(let type in gear) {
            let path = icons[type];
            let href = '#';
            let empty = true;
            let ench;
            if (enchant[type]) {
                for (let e of enchant[type])
                    if (e.selected && e.ench) ench = e.ench;
            }
            for (let item of gear[type]) {
                if (item.selected) {
                    path = item.p;
                    let id = item.id.toString().split('|');
                    href = id[0];
                    if (item.id == 23000399) href = "230003";
                    if (item.id == 22839799) href = "228397";
                    if (item.id == 22835099) href = "228350";
                    if (item.id == 23024299) href = "230242";
                    if (ench) href += '?ench=' + ench;
                    if (id.length == 2) href += (ench ? '&' : '?') + 'rand=' + id[1];
                    empty = false;
                }
            }
            $(`nav.paperdoll [data-type="${type}"]`).toggleClass('empty', empty);
            $(`nav.paperdoll [data-type="${type}"] a`).attr('href', `${WEB_DB_URL}item=${href}`);
            $(`nav.paperdoll [data-type="${type}"] img`).attr('src', `https://wow.zamimg.com/images/wow/icons/medium/${path}.jpg`);
        }
    },

    updateSession: function (i) {
        var view = this;

        let obj = {};
        obj.level = view.fight.find('input[name="level"]').val();
        obj.race = view.fight.find('select[name="race"]').val();
        obj.simulations = view.fight.find('input[name="simulations"]').val();
        obj.timesecsmin = view.fight.find('input[name="timesecsmin"]').val();
        obj.timesecsmax = view.fight.find('input[name="timesecsmax"]').val();
        obj.executeperc = view.fight.find('input[name="executeperc"]').val();
        obj.startrage = view.fight.find('input[name="startrage"]').val();
        obj.targetlevel = view.fight.find('input[name="targetlevel"]').val();
        obj.targetbasearmor = view.fight.find('select[name="targetbasearmor"]').val();
        obj.targetcustomarmor = view.fight.find('input[name="targetcustomarmor"]').val();
        obj.targetresistance = view.fight.find('input[name="targetresistance"]').val();
        obj.targetspeed = view.fight.find('input[name="targetspeed"]').val();
        obj.targetmindmg = view.fight.find('input[name="targetmindmg"]').val();
        obj.targetmaxdmg = view.fight.find('input[name="targetmaxdmg"]').val();
        obj.adjacent = view.fight.find('input[name="adjacent"]').val();
        obj.aqbooks = view.fight.find('select[name="aqbooks"]').val();
        obj.reactionmin = view.fight.find('input[name="reactionmin"]').val();
        obj.reactionmax = view.fight.find('input[name="reactionmax"]').val();
        obj.batching = view.fight.find('select[name="batching"]').val();
        obj.filter_strength = view.main.find('#filter_strength').hasClass('active');
        obj.filter_timeworn = view.main.find('#filter_timeworn').hasClass('active');
        obj.filter_bear = view.main.find('#filter_bear').hasClass('active');
        obj.filter_tiger = view.main.find('#filter_tiger').hasClass('active');
        obj.filter_green = view.main.find('#filter_green').hasClass('active');
        obj.filter_blue = view.main.find('#filter_blue').hasClass('active');
        obj.filter_epic = view.main.find('#filter_epic').hasClass('active');
        obj.bleedreduction = view.fight.find('select[name="bleedreduction"]').val();
        obj.spellqueueing = view.fight.find('select[name="spellqueueing"]').val();
        

        let _buffs = [], _rotation = [], _talents = [], _sources = [], _phases = [], _gear = {}, _enchant = {}, _runes = {}, _resistance = {};
        view.buffs.find('.active').each(function () { _buffs.push($(this).attr('data-id')); });
        view.filter.find('.sources .active').each(function () { _sources.push($(this).attr('data-id')); });
        view.filter.find('.phases .active').each(function () { _phases.push($(this).attr('data-id')); });

        for (let tree of talents) {
            let arr = [];
            for (let talent of tree.t)
                arr.push(talent.c);
            _talents.push({ n: tree.n, t: arr });
        }

        _rotation = spells;

        for (let type in gear) {
            _gear[type] = [];
            for (let item of gear[type]) {
                _gear[type].push({id:item.id,selected:item.selected,dps:item.dps,hidden:item.hidden});
            }
        }

        for (let type in enchant) {
            _enchant[type] = [];
            for (let item of enchant[type]) {
                _enchant[type].push({id:item.id,selected:item.selected,dps:item.dps,hidden:item.hidden});
            }
        }

        if (typeof runes !== "undefined") {
            for (let type in runes) {
                _runes[type] = [];
                for (let item of runes[type]) {
                    _runes[type].push({id:item.id,selected:item.selected,hidden:item.hidden});
                }
            }
        }

        var resistances = ['shadow', 'arcane', 'nature', 'fire', 'frost'];
        for (let resist in resistances) {
            var element = resistances[resist];
            _resistance[element] = $(".resistances[data-id='"+element+"-resist']").prop("checked");
        }

        obj.buffs = _buffs;
        obj.rotation = _rotation;
        obj.sources = _sources;
        obj.phases = _phases;
        obj.talents = _talents;
        obj.gear = _gear;
        obj.enchant = _enchant;
        obj.runes = _runes;
        obj.resistance = _resistance;
        if (globalThis.profilename) obj.profilename = globalThis.profilename;

        let profileid = globalThis.profileid || 0;
        localStorage[mode + profileid] = JSON.stringify(obj);
    },

    loadSession: function () {
        var view = this;
        let profileid = globalThis.profileid || 0;

        if (localStorage.level) localStorage.clear(); // clear old style of storage
        if (!localStorage[mode + profileid]) localStorage[mode + profileid] = JSON.stringify(session);

        // update everyone for P4
        if (mode == "sod" && localStorage.sodPatch !== "6") {
            localStorage.sodPatch = "6";
            localStorage.sod0 = JSON.stringify(session);
        }

        let storage = JSON.parse(localStorage[mode + profileid]);
        if (!storage.level) storage.level = session.level;
        if (!storage.targetlevel) storage.targetlevel = session.targetlevel;
        if (!storage.profilename) storage.profilename = session.profilename;
        if (typeof storage.filter_strength == 'undefined') storage.filter_strength = true;
        if (typeof storage.filter_timeworn == 'undefined') storage.filter_timeworn = true;
        if (typeof storage.filter_bear == 'undefined') storage.filter_bear = true;
        if (typeof storage.filter_tiger == 'undefined') storage.filter_tiger = true;
        if (typeof storage.filter_green == 'undefined') storage.filter_green = true;
        if (typeof storage.filter_blue == 'undefined') storage.filter_blue = true;
        if (typeof storage.filter_epic == 'undefined') storage.filter_epic = true;
        globalThis.profilename = storage.profilename;
        globalThis.filter_strength = storage.filter_strength;
        globalThis.filter_bear = storage.filter_bear;
        globalThis.filter_timeworn = storage.filter_timeworn;
        globalThis.filter_tiger = storage.filter_tiger;
        globalThis.filter_green = storage.filter_green;
        globalThis.filter_blue = storage.filter_blue;
        globalThis.filter_epic = storage.filter_epic;

        if (storage.targetbasearmor === 3731 || storage.targetbasearmor === null)
            storage.targetbasearmor = 3128;
        
        for (let prop in storage) {
            view.fight.find('input[name="' + prop + '"]').val(storage[prop]);
            view.fight.find('select[name="' + prop + '"]').val(storage[prop]);
            view.fight.find('.slider[name="slider-' + prop + '"]').val(storage[prop]);
        }
        view.sidebar.find('.bg').attr('data-race', view.fight.find('select[name="race"]').val());

        let basearmor = $('select[name="targetbasearmor"]').get(0);
        if (storage.targetcustomarmor) {
            $('input[name="targetcustomarmor"]').addClass('focus');
            basearmor.options[basearmor.options.length - 1].innerHTML = '';
        }
        else {
            $('input[name="targetcustomarmor"]').removeClass('focus');
            basearmor.options[basearmor.options.length - 1].innerHTML = 'Custom Value';
        }

        updateGlobals({
            talents: !storage.talents ? session.talents : storage.talents,
            buffs: !storage.buffs ? session.buffs : storage.buffs,
            rotation: !storage.rotation ? session.rotation : storage.rotation,
            gear: !storage.gear ? session.gear : storage.gear,
            enchant: !storage.enchant ? session.enchant : storage.enchant,
            runes: !storage.runes ? session.runes || {} : storage.runes,
            resistances: !storage.resistances ? null : storage.resistances,
        });

        let _sources = !storage.sources ? session.sources : storage.sources;
        let _phases = !storage.phases ? session.phases : storage.phases;
        if (mode == "sod") _phases = ["1","2","3","4","5"];

        for (let i of _sources)
            view.filter.find(`.sources [data-id="${i}"]`).addClass('active');

        for (let i of _phases)
            view.filter.find(`.phases [data-id="${i}"]`).addClass('active');

        var resistances = ['shadow', 'arcane', 'nature', 'fire', 'frost'];
        for (let resist in resistances) {
            var element = resistances[resist];
            if ( $(".resistances[data-id='"+element+"-resist']").prop("checked") ) {
                view.sidebar.find("."+element+"-resist.hidden").removeClass('hidden');
            }
        }

    },

    filterGear: function () {
        var view = this;
        var type = view.main.find('nav > ul > li.active').data('type');
        if (type == "mainhand" || type == "offhand")
            view.loadWeapons(type);
        else if (type == "custom")
            view.loadCustom();
        else
            view.loadGear(type);
    },

    loadWeapons: function (type, editmode) {
        var view = this;
        var filter = view.main.find('nav li.active .filter .active').text();

        let storage = JSON.parse(localStorage[mode + (globalThis.profileid || 0)]);
        let level = parseInt(storage.level);

        var resistCheckList = SIM.UI.resistCheckList();
        let table = `<table class="gear ${editmode ? 'editmode' : ''}" data-type="${type}" data-max="1">
                        <thead>
                            <tr>
                                ${editmode ? '<th></th>' : ''}
                                <th>ilvl</th>
                                <th>Name</th>
                                <th>Sta</th>
                                <th>Res</th>
                                <th>Str</th>
                                <th>Agi</th>
                                <th>AP</th>
                                <th>Crit</th>
                                <th>Hit</th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>Speed</th>
                                <th>Skill</th>
                                <th>Type</th>
                                <th>PPM</th>
                                <th>DPS</th>
                            </tr>
                        </thead>
                    <tbody>`;

        for (let item of gear[type]) {

            if (!item.selected && (item.r > level || (mode == "sod" && item.q < 3 && item.i < (level - 7)) || (mode == "sod" && item.q == 3 && item.i < (level - 10)) || (mode == "sod" && item.q == 4 && item.i < (level - 15)))) {
                continue;
            }

            if (!item.selected &&
                ((globalThis.filter_tiger === false && item.name.toLowerCase().indexOf('of the tiger') > -1) ||
                (globalThis.filter_strength === false && item.name.toLowerCase().indexOf('of strength') > -1) ||
                (globalThis.filter_bear === false && item.name.toLowerCase().indexOf('of the bear') > -1) ||
                (globalThis.filter_green === false && item.q == "2") ||
                (globalThis.filter_blue === false && item.q == "3") ||
                (globalThis.filter_epic === false && item.q == "4") ||
                (globalThis.filter_timeworn === false && item.tw))) {
                    if (globalThis.filter_timeworn === true && item.tw) {
                        // show item
                    }
                    else {
                        continue;
                    }
            }

            if (filter) {
                if (filter == "All") {
                    if (type == "offhand" && (storage.buffs.includes("71"))) { // Glad & Def Stance
                        if (item.type !== "Shield") continue;
                    }
                    else if (item.type == "Shield") continue;
                }
                else if (filter == "Mace & Sword") {
                    if (item.type != "Mace" && item.type != "Sword") continue;
                }
                else if (filter == "Axe, Dagger & Sword") {
                    if (item.type != "Axe"  && item.type != "Dagger" && item.type != "Sword") continue;
                }
                else if (item.type != filter)
                    continue;
            }

            let source = (item.source || "").toLowerCase(), phase = item.phase;
            if (item.source == 'Lethon' || item.source == 'Emeriss' || item.source == 'Kazzak' || item.source == 'Azuregos' || item.source == 'Ysondre' || item.source == 'Taerar' || item.source == 'Green Dragons')
                source = 'worldboss';

            if (item.subsource == 'shadow' || item.subsource == 'arcane' || item.subsource == 'nature' || item.subsource == 'fire' || item.subsource == 'frost')
                source = 'resistances-list';

            if (phase && !view.filter.find('.phases [data-id="' + phase + '"]').hasClass('active'))
                continue;
            if (source && !view.filter.find('.sources [data-id="' + source + '"]').hasClass('active'))
                continue;

            if (source === 'resistances-list' && !$(".resistances[data-id='"+item.subsource+"-resist']").prop("checked")) {
                continue;
            }

            if (item.hidden && !editmode) continue;

            let tooltip = item.id.toString().split('|')[0], rand = '';
            if (tooltip == 199211) tooltip = 19921;
            if (tooltip == 23000399) tooltip = 230003;
            if (tooltip == 22839799) tooltip = 228397;
            if (tooltip == 22835099) tooltip = 228350;
            if (tooltip == 23024299) tooltip = 230242;
            if (item.rand) rand = '?rand=' + item.rand;

            let resist = '';
            if (item.resist) {
                if (item.resist.fire) resist += item.resist.fire + ' FiR';
                if (item.resist.frost) resist += (resist.length ? ' + ' : '') + item.resist.frost + ' FR';
                if (item.resist.nature) resist += (resist.length ? ' + ' : '') + item.resist.nature + ' NR';
                if (item.resist.shadow) resist += (resist.length ? ' + ' : '') + item.resist.shadow + ' SR';
                if (item.resist.arcane) resist += (resist.length ? ' + ' : '') + item.resist.arcane + ' AR';
            }

            table += `<tr data-id="${item.id}" data-name="${item.name}" class="${item.selected ? 'active' : ''} ${item.hidden ? 'hidden' : ''}">
                        ${editmode ? '<td class="hide">' + (item.hidden ? eyesvghidden : eyesvg) + '</td>' : ''}
                        <td data-quality="${item.q}"><a href="${WEB_DB_URL}item=${tooltip}${rand}"></a>${item.i}</td>
                        <td>${item.name}</td>`

            table +=`<td>${item.sta || ''}</td>
                        <td>${resist || ''}</td>
                        <td>${item.str || ''}</td>
                        <td>${item.agi || ''}</td>
                        <td>${item.ap || ''}</td>
                        <td>${item.crit || ''}</td>
                        <td>${item.hit || ''}</td>
                        <td>${item.mindmg || ''}</td>
                        <td>${item.maxdmg || ''}</td>
                        <td>${item.speed || ''}</td>
                        <td>${item.skill || (item.skills && Object.values(item.skills)[0]) || ''}</td>
                        <td>${item.type || ''}</td>
                        <td class="ppm"><p contenteditable="true">${item.proc && item.proc.ppm || ''}</p></td>
                        <td>${item.dps || ''}</td>
                    </tr>`;
        }

        table += '</tbody></table></section>';

        view.tcontainer.empty();
        view.tcontainer.append(`<div class="topgear">
            <div class="search"><input name="search" placeholder="Search" />${searchSVG}</div>
            <div class="filters">
                <label id="filter_timeworn" class="${globalThis.filter_timeworn ? 'active' : ''}">Timeworn</label>
                <label id="filter_strength" class="${globalThis.filter_strength ? 'active' : ''}">Of Strength</label>
                <label id="filter_bear" class="${globalThis.filter_bear ? 'active' : ''}">Of the Bear</label>
                <label id="filter_tiger" class="${globalThis.filter_tiger ? 'active' : ''}">Of the Tiger</label>
                <label id="filter_green" class="${globalThis.filter_green ? 'active' : ''}">Greens</label>
                <label id="filter_blue" class="${globalThis.filter_blue ? 'active' : ''}">Blues</label>
                <label id="filter_epic" class="${globalThis.filter_epic ? 'active' : ''}">Epics</label>
            </div>
        </div>`);
        view.tcontainer.append(table);
        let dpsrow = view.tcontainer.find('table.gear th').length;
        view.tcontainer.find('table.gear').tablesorter({
            widthFixed: false,
            sortList: editmode ?  [[dpsrow, 1],[2, 0]] : [[dpsrow-1, 1],[1, 0]],
            textSorter : {
                15 : function(a, b, direction, column, table) {
                    var a = parseFloat(a.substring(0,a.indexOf('.') + 3));
                    var b = parseFloat(b.substring(0,b.indexOf('.') + 3));
                    if (isNaN(a)) a = 0;
                    if (isNaN(b)) b = 0;
                    return (a < b) ? -1 : (a > b) ? 1 : 0;
                },
            },
            headers: {
                15: { sorter: "text" }
            }
        });

        view.loadEnchants(type, editmode);
    },

    resistCheckList: function() {
        return {
            shadow: $(".resistances[data-id='shadow-resist']").prop("checked"),
            arcane: $(".resistances[data-id='arcane-resist']").prop("checked"),
            nature: $(".resistances[data-id='nature-resist']").prop("checked"),
            fire: $(".resistances[data-id='fire-resist']").prop("checked"),
            frost: $(".resistances[data-id='frost-resist']").prop("checked"),
        };
    },

    loadGear: function (type, editmode) {
        var view = this;
        if (!type) return;

        var resistCheckList = SIM.UI.resistCheckList();
        let storage = JSON.parse(localStorage[mode + (globalThis.profileid || 0)]);
        let level = parseInt(storage.level);

        var max = 1;
        let table = `<table class="gear ${editmode ? 'editmode' : ''}" data-type="${type}" data-max="${max}">
                        <thead>
                            <tr>
                                ${editmode ? '<th></th>' : ''}
                                <th>ilvl</th>
                                <th>Name</th>
                                <th>Sta</th>
                                <th>Res</th>
                                <th>Str</th>
                                <th>Agi</th>
                                <th>AP</th>
                                <th>Hit</th>
                                <th>Crit</th>
                                <th>Def</th>
                                <th>Skill</th>
                                <th>Type</th>
                                <th>DPS</th>
                            </tr>
                        </thead>
                    <tbody>`;

        for (let item of gear[type]) {
            
            if (!item.selected && (item.r > level || (mode == "sod" && item.q < 3 && item.i < (level - 7)) || (mode == "sod" && item.q == 3 && item.i < (level - 10)) || (mode == "sod" && item.q == 4 && item.i < (level - 15)))) {
                continue;
            }

            if (!item.selected &&
                ((globalThis.filter_tiger === false && item.name.toLowerCase().indexOf('of the tiger') > -1) ||
                (globalThis.filter_strength === false && item.name.toLowerCase().indexOf('of strength') > -1) ||
                (globalThis.filter_bear === false && item.name.toLowerCase().indexOf('of the bear') > -1) ||
                (globalThis.filter_green === false && item.q == "2") ||
                (globalThis.filter_blue === false && item.q == "3") ||
                (globalThis.filter_epic === false && item.q == "4") ||
                (globalThis.filter_timeworn === false && item.tw))) {
                    if (globalThis.filter_timeworn === true && item.tw) {
                        // show item
                    }
                    else {
                        continue;
                    }
            }

            let source = (item.source || "").toLowerCase(), phase = item.phase;
            if (item.source == 'Lethon' || item.source == 'Emeriss' || item.source == 'Kazzak' || item.source == 'Azuregos' || item.source == 'Ysondre' || item.source == 'Taerar' || item.source == 'Green Dragons')
                source = 'worldboss';

            if (item.subsource == 'shadow' || item.subsource == 'arcane' || item.subsource == 'nature' || item.subsource == 'fire' || item.subsource == 'frost')
                source = 'resistances-list';

            if (max == 2 &&
                ((phase && !view.filter.find('.phases [data-id="' + phase + '"]').hasClass('active')) ||
                (source && !view.filter.find('.sources [data-id="' + source + '"]').hasClass('active'))))
                item.selected = false;

            if (phase && !view.filter.find('.phases [data-id="' + phase + '"]').hasClass('active'))
                continue;
            if (source && !view.filter.find('.sources [data-id="' + source + '"]').hasClass('active')) {
                continue;
            }

            if (source === 'resistances-list' && !$(".resistances[data-id='"+item.subsource+"-resist']").prop("checked")) {
                continue;
            }

            if (item.hidden && !editmode) continue;

            let tooltip = item.id.toString().split('|')[0], rand = '';
            if (tooltip == 145541) tooltip = 14554;
            if (tooltip == 198981) tooltip = 19898;
            if (tooltip == 2207381) tooltip = 220738;

            
            if (item.rand) rand = '?rand=' + item.rand;

            let resist = '';
            if (item.resist) {
                if (item.resist.fire) resist += item.resist.fire + ' FiR';
                if (item.resist.frost) resist += (resist.length ? ' + ' : '') + item.resist.frost + ' FR';
                if (item.resist.nature) resist += (resist.length ? ' + ' : '') + item.resist.nature + ' NR';
                if (item.resist.shadow) resist += (resist.length ? ' + ' : '') + item.resist.shadow + ' SR';
                if (item.resist.arcane) resist += (resist.length ? ' + ' : '') + item.resist.arcane + ' AR';
            }

            table += `<tr data-id="${item.id}" class="${item.selected ? 'active' : ''} ${item.hidden ? 'hidden' : ''}">
                        ${editmode ? '<td class="hide">' + (item.hidden ? eyesvghidden : eyesvg) + '</td>' : ''}
                        <td data-quality="${item.q}"><a href="${WEB_DB_URL}item=${tooltip}${rand}"></a>${item.i}</td>
                        <td>${item.name}</td>`

            table += `<td>${item.sta || ''}</td>
                        <td>${resist || ''}</td>
                        <td>${item.str || ''}</td>
                        <td>${item.agi || ''}</td>
                        <td>${item.ap || ''}</td>
                        <td>${item.hit || ''}</td>
                        <td>${item.crit || ''}</td>
                        <td>${item.d || ''}</td>
                        <td>${item.skill || (item.skills && Object.values(item.skills)[0]) || ''}</td>
                        <td>${item.type || ''}</td>
                        <td>${item.dps || ''}</td>
                    </tr>`;
        }

        table += '</tbody></table></section>';

        view.tcontainer.empty();
        view.loadRunes(type, editmode);
        view.tcontainer.append(`<div class="topgear">
            <div class="search"><input name="search" placeholder="Search" />${searchSVG}</div>
            <div class="filters">
                <label id="filter_timeworn" class="${globalThis.filter_timeworn ? 'active' : ''}">Timeworn</label>
                <label id="filter_strength" class="${globalThis.filter_strength ? 'active' : ''}">Of Strength</label>
                <label id="filter_bear" class="${globalThis.filter_bear ? 'active' : ''}">Of the Bear</label>
                <label id="filter_tiger" class="${globalThis.filter_tiger ? 'active' : ''}">Of the Tiger</label>
                <label id="filter_green" class="${globalThis.filter_green ? 'active' : ''}">Greens</label>
                <label id="filter_blue" class="${globalThis.filter_blue ? 'active' : ''}">Blues</label>
                <label id="filter_epic" class="${globalThis.filter_epic ? 'active' : ''}">Epics</label>
            </div>
        </div>`);
        view.tcontainer.append(table);
        let dpsrow = view.tcontainer.find('table.gear th').length;
        view.tcontainer.find('table.gear').tablesorter({
            widthFixed: false,
            sortList: editmode ? [[dpsrow, 1],[2, 0]] : [[dpsrow-1, 1],[1, 0]],
            textSorter : {
                12 : function(a, b, direction, column, table) {
                    var a = parseFloat(a.substring(0,a.indexOf('.') + 3));
                    var b = parseFloat(b.substring(0,b.indexOf('.') + 3));
                    if (isNaN(a)) a = 0;
                    if (isNaN(b)) b = 0;
                    return (a < b) ? -1 : (a > b) ? 1 : 0;
                },
            },
            headers: {
                12: { sorter: "text" }
            }
        });

        view.loadEnchants(type, editmode);
        view.updateSession();
        view.updateSidebar();
    },

    loadCustom: function (editmode) {
        var view = this;

        var resistCheckList = SIM.UI.resistCheckList();
        let table = `<table class="gear ${editmode ? 'editmode' : ''}" data-type="custom" data-max="10">
                        <thead>
                            <tr>
                                ${editmode ? '<th></th>' : ''}
                                <th>Name</th>
                                <th>Str</th>
                                <th>Agi</th>
                                <th>AP</th>
                                <th>Hit</th>
                                <th>Crit</th>
                                <th>Skill</th>
                                <th>DPS</th>
                            </tr>
                        </thead>
                    <tbody>`;

        for (let item of gear.custom) {
            let resist = '';
            if (item.resist) {
                if (item.resist.fire) resist += item.resist.fire + ' FiR'; 
                if (item.resist.frost) resist += (resist.length ? ' + ' : '') + item.resist.frost + ' FR';
                if (item.resist.nature) resist += (resist.length ? ' + ' : '') + item.resist.nature + ' NR';
                if (item.resist.shadow) resist += (resist.length ? ' + ' : '') + item.resist.shadow + ' SR';
                if (item.resist.arcane) resist += (resist.length ? ' + ' : '') + item.resist.arcane + ' AR';
            }

            if (item.hidden && !editmode) continue;
            table += `<tr data-id="${item.id}" class="${item.selected ? 'active' : ''} ${item.hidden ? 'hidden' : ''}">
                        ${editmode ? '<td class="hide">' + (item.hidden ? eyesvghidden : eyesvg) + '</td>' : ''}
                        <td>${item.name}</td>
                        <td>${item.str || ''}</td>
                        <td>${item.agi || ''}</td>
                        <td>${item.ap || ''}</td>
                        <td>${item.hit || ''}</td>
                        <td>${item.crit || ''}</td>
                        <td>${item.skill_1 || ''}</td>
                        <td>${item.dps || ''}</td>
                    </tr>`;
        }

        table += '</tbody></table></section>';

        view.tcontainer.empty();
        view.tcontainer.append(table);
        view.tcontainer.find('table.gear').tablesorter({
            widthFixed: false,
            sortList: editmode ? [[9, 1]] : [[8, 1]],
        });
    },

    loadEnchants: function (type, editmode) {
        var view = this;
        view.main.find('.js-enchant').hide();

        let storage = JSON.parse(localStorage[mode + (globalThis.profileid || 0)]);
        let level = parseInt(storage.level);

        if (!enchant[type] || enchant[type].length == 0) return;

        var resistCheckList = SIM.UI.resistCheckList();
        let table = `<table class="enchant ${editmode ? 'editmode' : ''}" data-type="${type}" data-max="1">
                        <thead>
                            <tr>
                                ${editmode ? '<th></th>' : ''}
                                <th>Enchant</th>
                                <th>Res</th>
                                <th>Damage</th>
                                <th>Str</th>
                                <th>Agi</th>
                                <th>AP</th>
                                <th>Crit</th>
                                <th>Hit</th>
                                <th>Haste</th>
                                <th>PPM</th>
                                <th>DPS</th>
                            </tr>
                        </thead>
                    <tbody>`;

        for (let item of enchant[type]) {

            if (item.r > level) {
                item.selected = false;
                continue;
            }

            if (item.phase && !view.filter.find('.phases [data-id="' + item.phase + '"]').hasClass('active'))
                continue;

            if (item.hidden && !editmode) continue;

            let resist = '';
            if (item.resist) {
                if (item.resist.fire) resist += item.resist.fire + ' FiR'; 
                if (item.resist.frost) resist += (resist.length ? ' + ' : '') + item.resist.frost + ' FR';
                if (item.resist.nature) resist += (resist.length ? ' + ' : '') + item.resist.nature + ' NR';
                if (item.resist.shadow) resist += (resist.length ? ' + ' : '') + item.resist.shadow + ' SR';
                if (item.resist.arcane) resist += (resist.length ? ' + ' : '') + item.resist.arcane + ' AR';
            }

            table += `<tr data-id="${item.id}" data-temp="${item.temp || false}" class="${item.selected ? 'active' : ''} ${item.hidden ? 'hidden' : ''}">
                        ${editmode ? '<td class="hide">' + (item.hidden ? eyesvghidden : eyesvg) + '</td>' : ''}
                        <td><a href="${WEB_DB_URL}${item.spellid ? 'spell' : 'item'}=${item.id}"></a>${item.name}</td>
                        <td>${resist || ''}</td>
                        <td>${item.bonusdmg || ''}</td>
                        <td>${item.str || ''}</td>
                        <td>${item.agi || ''}</td>
                        <td>${item.ap || ''}</td>
                        <td>${item.crit || ''}</td>
                        <td>${item.hit || ''}</td>
                        <td>${item.haste || ''}</td>
                        <td>${item.ppm || ''}</td>
                        <td>${item.dps || ''}</td>
                    </tr>`;
        }

        table += '</tbody></table></section>';

        if ($(table).find('tbody tr').length == 0) return;

        view.tcontainer.append(table);
        view.tcontainer.find('table.enchant').tablesorter({
            widthFixed: false,
            sortList: editmode ? [[12, 1]] : [[11, 1]],
            headers: {
                11: { sorter: "text" }
            }
        });

        view.main.find('.js-enchant').show();
    },

    loadRunes: function (type, editmode) {
        var view = this;

        if (typeof runes === 'undefined' || !runes[type] || runes[type].length == 0) return;

        let html = $(`<div class="runes" data-type="${type}" style="display: none"></div>`);
        html.append('<label>Runes</label>')
        for (let item of runes[type]) {

            html.append(`
                <div data-id="${item.id}" class="rune ${item.selected ? 'active' : ''}">
                    <div class="icon">
                        <img src="https://wow.zamimg.com/images/wow/icons/medium/${item.iconname}.jpg" alt="${item.name}">
                        <a href="${WEB_DB_URL}spell=${item.id}" class="wh-tooltip"></a>
                    </div>
                </div>`);
        }

        view.tcontainer.append(html);
    },

    addAlert: function (msg) {
        var view = this;
        let rng = (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        view.alerts.empty().append(`<div id="alert${rng}" class="alert"><p>${msg}</p></div>`);
        view.alerts.find('.alert').click(function () { view.closeAlert(rng); });
        setTimeout(function () { view.alerts.find('#alert' + rng).addClass('in-up') });
        setTimeout(function () { view.closeAlert(rng); }, 4000);
    },

    closeAlert: function (rng) {
        var view = this;
        view.alerts.find('#alert' + rng).removeClass('in-up');
        setTimeout(function () { view.alerts.find('#alert' + rng).remove(); }, 1000);
    },

    firstSession: function () {
        console.log('Welcome!');
    },

    initLog: function () {
        const view = this;
        $('.modal').each(function() {
            dragElement($(this).get(0));
        });
        $('.modal .btn-close').click(function() {
            $('.modal').hide();
        });
        

    },

};

var eyesvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z"/></svg>';
var eyesvghidden = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11.885 14.988l3.104-3.098.011.11c0 1.654-1.346 3-3 3l-.115-.012zm8.048-8.032l-3.274 3.268c.212.554.341 1.149.341 1.776 0 2.757-2.243 5-5 5-.631 0-1.229-.13-1.785-.344l-2.377 2.372c1.276.588 2.671.972 4.177.972 7.733 0 11.985-8.449 11.985-8.449s-1.415-2.478-4.067-4.595zm1.431-3.536l-18.619 18.58-1.382-1.422 3.455-3.447c-3.022-2.45-4.818-5.58-4.818-5.58s4.446-7.551 12.015-7.551c1.825 0 3.456.426 4.886 1.075l3.081-3.075 1.382 1.42zm-13.751 10.922l1.519-1.515c-.077-.264-.132-.538-.132-.827 0-1.654 1.346-3 3-3 .291 0 .567.055.833.134l1.518-1.515c-.704-.382-1.496-.619-2.351-.619-2.757 0-5 2.243-5 5 0 .852.235 1.641.613 2.342z"/></svg>';
var searchSVG = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 50 50" width="20px" height="20px"><path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"/></svg>';

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (elmnt.querySelector('.head')) {
      // if present, the header is where you move the DIV from:
      elmnt.querySelector('.head').onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }
  
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
  
    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }