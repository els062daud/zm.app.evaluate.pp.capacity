// this one works proceed with the dirapikan
sap.ui.define(
  ["sap/ui/core/mvc/ControllerExtension"],
  function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend(
      "customer.zm.app.evaluate.pp.capacity.autorefresh",
      {
        override: {
          onInit: function () {
            console.log("Test INIT");
            this._oTimer = null;
          },

          onAfterRendering: function () {
            // take interval time from zzcat_custobj
            this._loadIntervalFromBackend()
              .then((iMs) => {
                this._iRefreshInterval = iMs;
                this._start();
                // if sucess then start the auto refresh
              })
              .catch((err) => {
                // error handling failed
              });
          },

          onExit: function () {
            this._stop();
          },
        },

        /* ===== Timer ===== */
        _start: function () {
          if (this._oTimer) {
            // reset timer avoid double start
            this._stop();
          }
          // set interval
          this._oTimer = setInterval(
            function () {
              this._performRefresh();
            }.bind(this),
            this._iRefreshInterval,
          );
        },

        _stop: function () {
          if (this._oTimer) {
            // clear interval and stop
            clearInterval(this._oTimer);
            this._oTimer = null;
          }
        },

        /* ===== Refresh logic ===== */
        _performRefresh: function () {
          try {
            // Fallback (if extensionAPI not available): manual rebinds
            const oView = this.getView();

            const oSmartChart = oView.findAggregatedObjects(true, function (o) {
              return o.isA && o.isA("sap.ui.comp.smartchart.SmartChart");
            })[0];
            if (oSmartChart && typeof oSmartChart.rebindChart === "function") {
              oSmartChart.rebindChart();
              console.log("SmartChart rebound (fallback)");
            }

            const oSmartTable = oView.findAggregatedObjects(true, function (o) {
              return o.isA && o.isA("sap.ui.comp.smarttable.SmartTable");
            })[0];
            if (oSmartTable && typeof oSmartTable.rebindTable === "function") {
              oSmartTable.rebindTable();
              console.log("SmartTable rebound (fallback)");
            }
          } catch (oError) {
            // error refresh
          }
        },

        _loadIntervalFromBackend: function () {
          return new Promise((resolve, reject) => {
            const sModelName = "customer.ZMPP_GW_PPAUTOREFRESH_SRV";
            const oModel = this.getView()?.getModel(sModelName);

            if (!oModel) {
              return reject();
              // error handling odata model not found
            }

            oModel
              .metadataLoaded()
              .then(() => {
                oModel.read("/CustomObjectSet", {
                  success: (oData) => {
                    try {
                      const a = oData?.results || oData?.d?.results;
                      if (!a || a.length === 0) {
                        // error handling data empty in odata
                      }

                      const v = a[0].FieldValue; // get the first array and FieldValue
                      // make sure fieldValue isnumber
                      const iMinutes = Number(v);
                      if (!Number.isFinite(iMinutes) || iMinutes <= 0) {
                        // error handling invalid value
                      }

                      const iMs = iMinutes * 60 * 1000;
                      console.log("Timer in ms: ", iMs);
                      // const iMs = 6000;
                      resolve(iMs);
                    } catch (e) {
                      reject(e);
                    }
                  },
                  error: (oError) => {
                    reject(oError);
                  },
                });
              })
              .catch((e) => reject(e));
          });
        },
      },
    );
  },
);
``;
