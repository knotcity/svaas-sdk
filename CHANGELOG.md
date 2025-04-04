# 1.16.2 / 2025-03-31

## :nut_and_bolt: Other

* Fix `changeBluetoothKey` function not calling the right endpoint.

# 1.16.1 / 2025-03-27

## :nut_and_bolt: Other

* Fix return type of `fetchVehicleBluetoothKey`

# 1.16.0 / 2025-03-26

## :tada: Enhancements

* Add vehicle's `bluetooth_key` in `getVehicleInformation()` result.
* Add function to retrieve the bluetooth key from a vehicle: `fetchVehicleBluetoothKey`.
* Add function to change the bluetooth key of a vehicle: `changeBluetoothKey`.

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.15.0 / 2025-01-27

## :tada: Enhancements

* **BREAKING CHANGE** `model_type` is now deprecated on stations and vehicles. Replaced by the following:
* Stations: add `energy_source` and `badge_reader_per_spot` properties on stations info.
* Vehicles: add `model_kind`, `energy_source`, `has_iot`, `has_sleeve` and `can_be_remotely_locked` properties on vehicles info.

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.14.5 / 2025-01-08

## :tada: Enhancements

* Add BLOCKED_FOR_SECURITY code in KnotCode enum

# 1.14.4 / 2025-01-06

## :bug: Fixes

* Add missing station alert type in enum (LOCKER_STUCK) that can happen on V6 stations.

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.14.3 / 2024-08-26

## :bug: Fixes

* Fix content length computation with unicode characters.

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.14.1 / 2024-08-22

## :bug: Fixes

* Add security for max string size of label and group

# 1.14.0 / 2024-06-14

## :tada: Enhancements

* Updated `configureVehicle` function to allow speeds up to 30km/h

# 1.13.0 / 2025-05-12

## :tada: Enhancements

* **BREAKING CHANGE** Remove deprecated shake, critical-energy, high-temp & spot defect station events
* Add new function to define label & group

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.12.0 / 2023-12-06

## :tada: Enhancements

* Add spotId to badge feedback for station v6

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.11.1 / 2023-11-09

## :tada: Enhancements

* Add battery level to vehicle information
* Add INCORRECT_LOCK in StationAlertCode
* Add vehicle fault code: BRAKE_SENSOR

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.11.0 / 2023-05-23

## :tada: Enhancements

* Update event type to match what is currently in use.
* Add function to update a station geolocation.
* Add an option to ignore the station response when unlocking a vehicle.

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.10.0 / 2023-04-17

## :tada: Enhancements

* Add new a function to enable or disable the vehicle throttle.

## :nut_and_bolt: Other

* Upgrade dependencies.

# 1.9.0 / 2023-02-09

## :tada: Enhancements

* Add types for station fault and alert

## :nut_and_bolt: Other

* Upgrade dependencies

# 1.8.2 / 2023-01-23

## :nut_and_bolt: Other

* Upgrade dependencies

# 1.8.1 / 2022-09-23

## :tada: Enhancements

* Add VEHICLE_IS_BUSY code.

# 1.8.0 / 2022-04-12

## :tada: Enhancements

* Add error details.

# 1.7.0 / 2022-03-10

## :tada: Enhancements

* Add new a function to scan a specified spot.

## :nut_and_bolt: Other

* Add ESM compatibility
* Upgrade dependencies

# 1.6.0 / 2021-11-17

## :tada: Enhancements

* Update Knot code list

## :nut_and_bolt: Other

* Upgrade dependencies

# 1.5.0 / 2021-09-30

## :tada: Enhancements

* Add vehicle fault status

## :nut_and_bolt: Other

* Upgrade dependencies

# 1.4.0 / 2021-09-28

## :tada: Enhancements

* Add vehicle alert and fault codes

## :nut_and_bolt: Other

* Upgrade dependencies

# 1.3.0 / 2021-09-07

## :tada: Enhancements

* Add changeVehicleSpeedMode function

## :nut_and_bolt: Other

* Update documentation URL

# 1.2.2 / 2021-05-03

## :nut_and_bolt: Other

* Add missing Knot code

# 1.2.1 / 2021-03-31

## :nut_and_bolt: Other

* Upgrade dependencies

# 1.2.0 / 2021-03-31

## :tada: Enhancements

* Add configureVehicle and changeVehicleLightState functions

# 1.1.2 / 2021-03-17

## :bug: Fixes

* Allow lockId 0 for lockVehicles

# 1.1.1 / 2021-03-01

## :nut_and_bolt: Other

* Add alarm-threshold in StationConfigType

# 1.1.0 / 2021-02-22

## :tada: Enhancements

* Add a new parameter in KnotSVaaS class to customize Axios configs

## :bug: Fixes

* Fix getEnabledVehicles and getEnabledStations

## :nut_and_bolt: Other

* Update eslint config and fix files

# 1.0.2 / 2021-02-16

## :bug: Fixes

* Fix Typescript types of response data

# 1.0.1 / 2021-02-16

## :bug: Fixes

* Fix Typescript types of response data

# 1.0.0 / 2021-02-15

## :nut_and_bolt: Other

* First public release on Github and npmjs.org
