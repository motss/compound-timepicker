[![GitHub version](https://badge.fury.io/gh/motss%2Fcompound-timepicker.svg)](https://badge.fury.io/gh/motss%2Fcompound-timepicker)
[![Bower version](https://badge.fury.io/bo/compound-timepicker.svg)](https://badge.fury.io/bo/compound-timepicker)

# compound-timepicker
============

Compound is composed of two or more separate elements and `compound-timepicker` happens to be under this category.

`compound-timepicker` is a timepicker. It is used to select a single time (hours: minutes) on both mobile and desktop web applications.
The selected time is indicated by the filled circle at the end of each clock hand.

Example:

    <compound-timepicker></compound-timepicker>
    <compound-timepicker hours="23"></compound-timepicker>
    <compound-timepicker minutes="59"></compound-timepicker>
    <compound-timepicker step="5"></compound-timepicker>
    <compound-timepicker time-format="24"></compound-timepicker>

On mobile, pickers are best suited for display in a confirmation dialog. The timepicker can be wrapped inside a `paper-dialog`. `compound-timepicker-dialog` is created alongside `compound-timepicker` to provide a easy-to-use dialog timepicker.

Example:

    <compound-timepicker-dialog></compound-timepicker-dialog>
    <compound-timepicker-dialog hours="23"></compound-timepicker-dialog>
    <compound-timepicker-dialog minutes="59"></compound-timepicker-dialog>
    <compound-timepicker-dialog step="5"></compound-timepicker-dialog>
    <compound-timepicker-dialog time-format="24"></compound-timepicker-dialog>

## Styling

Style the timepicker with CSS as you would a normal DOM element.
Click [here](http://motss.github.io/compound-timepicker/components/compound-timepicker/#styling) to learn more.

## Generating your own boilerplate code of the compounds

At the end of the demo, there is a section where user can play around with to generate your own boilerplate code with the attributes provided.
