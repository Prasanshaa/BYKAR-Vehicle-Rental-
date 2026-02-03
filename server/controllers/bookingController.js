import Booking from "../models/Booking.js"
import Car from "../models/Car.js";
import sendEmail from "../utils/sendEmail.js";


// Function to Check Availability of Car for a given Date
const checkAvailability = async (car, pickupDate, returnDate)=>{
    const bookings = await Booking.find({
        car,
        pickupDate: {$lte: returnDate},
        returnDate: {$gte: pickupDate},
    })
    return bookings.length === 0;
}

// API to Check Availability of Cars for the given Date and location
export const checkAvailabilityOfCar = async (req, res)=>{
    try {
        const {location, pickupDate, returnDate} = req.body

        // fetch all available cars for the given location
        const cars = await Car.find({location, isAvaliable: true})

        // check car availability for the given date range using promise
        const availableCarsPromises = cars.map(async (car)=>{
           const isAvailable = await checkAvailability(car._id, pickupDate, returnDate)
           return {...car._doc, isAvailable: isAvailable}
        })

        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true)

        res.json({success: true, availableCars})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to Create Booking
export const createBooking = async (req, res) => {
    try {
        const { _id, email, name } = req.user;
        const { car, pickupDate, returnDate } = req.body;

        const isAvailable = await checkAvailability(car, pickupDate, returnDate);
        if (!isAvailable) {
            return res.json({ success: false, message: "Car is not available" });
        }

        const carData = await Car.findById(car);

        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil(
            (returned - picked) / (1000 * 60 * 60 * 24)
        );

        const price = carData.pricePerDay * noOfDays;

        const booking = await Booking.create({
            car,
            owner: carData.owner,
            user: _id,
            pickupDate,
            returnDate,
            price,
        });

        console.log(" Booking created");
        console.log(" User email:", email);

        const emailMessage = `
Hello ${name},

Your vehicle booking has been successfully confirmed 🚗

Vehicle: ${carData.brand} ${carData.model}
Pickup Date: ${pickupDate}
Return Date: ${returnDate}
Total Price: ₹${price}

Thank you for choosing BYKAR Vehicle Rental.
We wish you a comfortable, safe, and pleasant journey.

Warm regards,  
BYKAR Team

`;

        //  EMAIL MUST BE IN ITS OWN TRY–CATCH
        try {
            console.log(" Starting email sending...");
            await sendEmail(
                email,
                "Vehicle Booking Confirmation - BYKAR",
                emailMessage
            );
            console.log("📨 Email process finished");
        } catch (emailError) {
            console.log(" Email failed but booking successful");
        }

        //  RESPONSE ALWAYS SENT
        res.json({ success: true, message: "Booking Created" });

    } catch (error) {
        console.log(" Booking error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// API to List User Bookings 
export const getUserBookings = async (req, res)=>{
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({ user: _id }).populate("car").sort({createdAt: -1})
        res.json({success: true, bookings})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get Owner Bookings

export const getOwnerBookings = async (req, res)=>{
    try {
        if(req.user.role !== 'owner'){
            return res.json({ success: false, message: "Unauthorized" })
        }
        const bookings = await Booking.find({owner: req.user._id}).populate('car user').select("-user.password").sort({createdAt: -1 })
        res.json({success: true, bookings})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to change booking status
export const changeBookingStatus = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {bookingId, status} = req.body

        const booking = await Booking.findById(bookingId)

        if(booking.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized"})
        }

        booking.status = status;
        await booking.save();

        res.json({ success: true, message: "Status Updated"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}