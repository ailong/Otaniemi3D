'use strict';

/**
 * @ngdoc function
 * @name otaniemi3dApp.controller:AnalyticsCtrl
 * @description
 * # AnalyticsCtrl
 * Controller of the otaniemi3dApp
 */
angular.module('otaniemi3dApp')
  .controller('AnalyticsCtrl', function ($scope, $window, omiMessage, $modal) {

    $scope.sensor = null;
    $scope.sensors = [];
    $scope.searchStr = '';
    //Bootstrap small size < 992px
    $scope.mobileDevice = $window.innerWidth < 992;

    angular.element($window).resize(function () {
      $scope.mobileDevice = $window.innerWidth < 992;
    });

    var temperatureColor = '#f15c80';
    var pirColor = '#90ed7d';
    var lightColor = '#f7a35c';
    var co2Color = '#7e09e8';
    var humidityColor = '#2150ff';

    $scope.alert = {
      show: false,
      message: ''
    };
    $scope.chartConfig = {
      xAxis: {
        type: 'datetime'
      },
      yAxis: [
        {
          labels: {
            format: '{value}°C',
            style: {
              color: temperatureColor,
              fontWeight: 'bold'
            }
          },
          title: {
            text: 'Temperature',
            style: {
              color: temperatureColor,
              fontWeight: 'bold'
            }
          },
          id: 'temperature'
        },
        {
          labels: {
            format: '{value} lux',
            style: {
              color: lightColor,
              fontWeight: 'bold'
            }
          },
          title: {
            text: 'Light',
            style: {
              color: lightColor,
              fontWeight: 'bold'
            }
          },
          id: 'light'
        },
        {
          labels: {
            format: '{value}',
            style: {
              color: pirColor,
              fontWeight: 'bold'
            }
          },
          title: {
            text: 'Pir',
            style: {
              color: pirColor,
              fontWeight: 'bold'
            }
          },
          id: 'pir'
        },
        {
          labels: {
            format: '{value}%',
            style: {
              color: humidityColor,
              fontWeight: 'bold'
            }
          },
          title: {
            text: 'Humidity',
            style: {
              color: humidityColor,
              fontWeight: 'bold'
            }
          },
          id: 'humidity',
          opposite: true
        },
        {
          labels: {
            format: '{value} ppm',
            style: {
              color: co2Color,
              fontWeight: 'bold'
            }
          },
          title: {
            text: 'CO2',
            style: {
              color: co2Color,
              fontWeight: 'bold'
            }
          },
          id: 'co2',
          opposite: true
        }
      ],
      series: [{
        name: ' ',
        id: 'placeholder-series'
      }],
      title: {
        text: 'Data history'
      },
      noData: 'Add sensors to drop area to see data chart'
    };

    var day, week, month, year;
    day = week = month = year = new Date();

    day.setDate(day.getDate() - 1);
    week.setDate(week.getDate() - 7);
    month.setMonth(month.getMonth() - 1);
    year.setYear(year.getYear() - 1);

    $scope.timeFrames = [
      { text: 'Current',
        icon: 'assets/shared/images/latest.svg',
        params: { newest: 20 } },
      { text: 'Last Week',
        icon: 'assets/shared/images/week.svg',
        params: { begin: week.toISOString() } },
      { text: 'Last Month',
        icon: 'assets/shared/images/month.svg',
        params: { begin: month.toISOString() } },
      { text: 'Last Year',
        icon: 'assets/shared/images/year.svg',
        params: { begin: year.toISOString() } },
      { text: 'Select range',
        icon: 'assets/shared/images/time-range.svg',
        params: { begin: null, end: null } },
    ];

    $scope.timeFrame = $scope.timeFrames[0];

    $scope.selectTime = function (timeFrame) {
      if (timeFrame.text === 'Select range') {
        $scope.modalInstance = $modal.open({
          templateUrl: 'html/templates/select-range.html',
          controller: 'ModalCtrl',
          controllerAs: 'modal',
          resolve: {
            params: function () {
              return {
                timeFrame: timeFrame
              };
            }
          }
        });

        $scope.modalInstance.result.then(function (params) {
          var time = params.timeFrame.params;

          if (time.begin && time.end) {
            $scope.timeFrame = params.timeFrame;
            $scope.timeFrame.params.begin = time.begin.toISOString();
            $scope.timeFrame.params.end = time.end.toISOString();
          }
        });
      } else {
        $scope.timeFrame = timeFrame;
      }
    };

    $scope.clearSensors = function () {
      $scope.sensors = [];
      $scope.sensor = null;
      $scope.chartConfig.series = [{
        name: ' ',
        data : [],
        legend: {
          enabled: false
        },
        id: 'placeholder-series'
      }];
    };

    $scope.addSensor = function (sensor) {
      if (angular.isArray(sensor)) {
        if (!sensor.length) {
          return;
        }
        angular.forEach(sensor, function (value) {
          $scope.addSensor(value);
        });
        return;
      }

      for (var k = 0; k < $scope.chartConfig.series.length; k++) {
        if ($scope.chartConfig.series[k].id === sensor.id) {
          return;
        }
      }

      // Request must follow JXON notation and comply with ODF.
      // https://developer.mozilla.org/en-US/docs/JXON
      var request = {
        'Object': {
          'id': {
            'keyValue': 'K1'
          },
          'Object': {
            'id': {
              'keyValue': sensor.room
            },
            'InfoItem': {
              '@name': sensor.name
            }
          }
        }
      };

      var params = $scope.timeFrame.params;
      $scope.chartConfig.loading = true;

      omiMessage.send('read', request, params).then(function success (data) {
        var selectedSensor = data[0],
            sensorData = [];

        $scope.sensor = sensor;
        $scope.sensors.push(sensor);

        for (var j = 0; j < selectedSensor.values.length; j++) {
          sensorData.push([
            new Date(selectedSensor.values[j].time).getTime(),
            selectedSensor.values[j].value,
          ]);
        }

        if ($scope.chartConfig.series.length &&
            $scope.chartConfig.series[0].id === 'placeholder-series') {
          $scope.chartConfig.series = [];
        }

        var color;
        switch (selectedSensor.type) {
          case 'temperature':
            color = temperatureColor;
            break;
          case 'light':
            color = lightColor;
            break;
          case 'pir':
            color = pirColor;
            break;
          case 'humidity':
            color = humidityColor;
            break;
          case 'co2':
            color = co2Color;
            break;
          default:
            color = '#707070';
        }

        $scope.chartConfig.series.push({
          name: selectedSensor.room + ': ' + selectedSensor.name,
          data: sensorData,
          tooltip: {
            valueSuffix: ' ' + selectedSensor.suffix
          },
          id: selectedSensor.id,
          yAxis: selectedSensor.type,
          color: color
        });

        $scope.alert.show = false;
        $scope.alert.message = '';

      }, function error (reason) {
        $scope.alert.show = true;
        $scope.alert.message = reason;
      })
      .finally(function () {
        $scope.chartConfig.loading = false;
      });
    };

    $scope.dropSensor = function (event) {
      // body...
    };

  });
