window.ChartTools = {
    chartMap: {},
    drawChart: function (canvasId, chartType, labels, dataSets){
        return new Promise((resolve) => {
            try {
                // try destroying any pre-existing chart for this canvas id.
                this.chartMap[canvasId].destroy();
            } catch (error) {
                // no char existed for the canvas id.
            }
            try {
                if (typeof labels == "string") labels = JSON.parse(labels);
                if (typeof dataSets == "string") dataSets = JSON.parse(dataSets);
                this.chartMap[canvasId] = new Chart(
                    document.getElementById(canvasId),
                    {
                        type: chartType,
                        data: {
                            labels: labels,
                            datasets: dataSets
                        }
                    }
                );
                resolve(true);
            } catch (error) {
                console.error(`ChartTools.drawChart ERROR: ${error.message}`);
                resolve(false);
            }
        })
    }
}