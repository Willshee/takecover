/*
 * Microbit countdown "bomb"
 * 
 * For Micro:bit installed in with Kitronik Move:Motor
 */

/* Function for the "explosion" behaviour */
function explode () {
    moveMotorZIP.showColor(Kitronik_Move_Motor.colors(Kitronik_Move_Motor.ZipLedColors.Red))
    Kitronik_Move_Motor.spin(Kitronik_Move_Motor.SpinDirections.Left, 100)
    basic.showIcon(IconNames.No)
    basic.pause(1000)
    for (let spinspeed = 90; spinspeed > 0; spinspeed -= 10 ) {
        Kitronik_Move_Motor.spin(Kitronik_Move_Motor.SpinDirections.Left, spinspeed)
        basic.pause(200)
    }
    Kitronik_Move_Motor.stop()
    basic.clearScreen()
    moveMotorZIP.clear()
    moveMotorZIP.show()
    basic.pause(2000)
    status = 1
    control.inBackground(scanLEDS);
    basic.showString("Done")
}

/* Function to generate beeps at reducing time period
  Only runs when status == 2, exits if status changed
*/
function doBeeps (beepPeriod: number) {
    while (status == 2) {
        music.playTone(262, 120)
        moveMotorZIP.rotate(1)
        moveMotorZIP.show()
        pause(beepPeriod);
        beepPeriod = Math.max(Math.round(beepPeriod * 0.85), 200)
    }
}

/* LED_level function calculates an LED illumination level based on time
   value, period of cycle and required phase offset in fractions of a period
*/
function LED_level (timeval: number, period: number, phase: number) {
    timeval = (timeval + phase * period) % period
    if (timeval <= period / 3) {
        return Math.round(100 * (timeval * 3 / period))
    } else if (timeval <= 2 * period / 3) {
        return Math.round(100 * (2 - timeval * 3 / period))
    } else {
        return 0
    }
}

/* Function to give LED scanning effect when waiting for countdown
   Sets LED levels based on time value to give a rotating animation effect
   Runs while status is set to 1, exits when status changes
*/
function scanLEDS () {
let timeval = 0 // holds running time in ms

    while (status == 1) {
        timeval = input.runningTime()
        moveMotorZIP.setZipLedColor(0, Kitronik_Move_Motor.rgb(0, LED_level(timeval, scanPeriod, 0), 0))
        moveMotorZIP.setZipLedColor(1, Kitronik_Move_Motor.rgb(0, LED_level(timeval, scanPeriod, 0.75), 0))
        moveMotorZIP.setZipLedColor(2, Kitronik_Move_Motor.rgb(0, LED_level(timeval, scanPeriod, 0.5), 0))
        moveMotorZIP.setZipLedColor(3, Kitronik_Move_Motor.rgb(0, LED_level(timeval, scanPeriod, 0.25), 0))
        moveMotorZIP.show()
        basic.pause(40)
    }
}

/* Button B event handler
If in the countdown when button B is pressed, resets to waiting
and restarts the LED scaning Function
*/
input.onButtonPressed(Button.B, () => {
    if (status == 2) {
        status = 1
        basic.clearScreen()
        control.inBackground(scanLEDS);
    }
})

/* Function to run the countdown
  Counts down timer
  Checks for other fibres changing the state.
  If counter reaches zero without state changing, calls the explode Function
*/
function runCountdown () {
    const countLength = 10 // counter length in seconds
    let count = 0 // holds current status of counter in seconds
    let startTime = 0 // holds time when the counter was started
    let pauseTime = 0 // calculated pause time until the next count, in ms

    startTime = input.runningTime() // record the time the counter
    count = countLength

    // run a loop to count down the counter or until another fibre
    // changes the status
    while (status == 2 && count > 0) {
        basic.showNumber(count)  // display the count
        count += -1 // decrement the counter

        // Work out a pause time:
        // timer value required at the next count less current timer value
        // then do the pause
        pauseTime = Math.max( startTime + 1000 * (countLength - count) - input.runningTime(),
            0 )
        basic.pause(pauseTime)
    }

    // Test why we left the loop - if still in countdown status then call
    // the explode function.  Otherwise do nothing.
    if (status == 2) {
        status = 3
        explode()
    }
}

/* LogoEvent handler
If the logo is pressed while waiting to start, launches the countdown
*/
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (status == 1) { // Was waiting to start
        status = 2 // counting down

        // set up 2 LEDs to be orange, two off
        moveMotorZIP.setZipLedColor(0, Kitronik_Move_Motor.rgb(100, 30, 0))
        moveMotorZIP.setZipLedColor(1, Kitronik_Move_Motor.colors(Kitronik_Move_Motor.ZipLedColors.Black))
        moveMotorZIP.setZipLedColor(2, Kitronik_Move_Motor.rgb(100, 30, 0))
        moveMotorZIP.setZipLedColor(3, Kitronik_Move_Motor.colors(Kitronik_Move_Motor.ZipLedColors.Black))
        moveMotorZIP.show()

        // start two background fibres - sounding beeps and counting down
        control.inBackground( () => {doBeeps(1000)} )
        control.inBackground( runCountdown )
    }
})

// Global Variables
let status = 0 // Used to track state for state machine operation
/*
Status is defined as
  1 waiting to start (running scanLEDS)
  2 counting down
  3 exploding
*/
let moveMotorZIP: Kitronik_Move_Motor.MoveMotorZIP = null // Zip LED class
const scanPeriod = 2000 // Period to rotate the scanning LEDs

// set up the neoPixel class
moveMotorZIP = Kitronik_Move_Motor.createMoveMotorZIPLED(4)

// Sensor commented out as not currently used (potential trigger)
// set up the ultranic sensor to measure in cm
// Kitronik_Move_Motor.setUltrasonicUnits(Kitronik_Move_Motor.Units.Centimeters)

basic.showString("Ready")  // Message to the user
status = 1  // set status to waiting
control.inBackground ( scanLEDS );  // start function to scan LEDs
