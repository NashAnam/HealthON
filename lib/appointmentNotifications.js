// Appointment Notification System with Creative Messages
import { showInstantNotification } from './notifications';
import toast from 'react-hot-toast';

/**
 * Send notification when appointment is booked
 */
export const notifyAppointmentBooked = (appointment, doctor) => {
    const title = '🎉 Appointment Confirmed!';
    const body = `Great choice! Dr. ${doctor.name} is ready to see you on ${appointment.appointment_date} at ${appointment.appointment_time}. Mark your calendar!`;

    // Show browser notification
    if (Notification.permission === 'granted') {
        showInstantNotification(title, body);
    }

    // Also show toast for immediate feedback
    toast.success(body, {
        duration: 5000,
        icon: '📅'
    });
};

/**
 * Check for upcoming appointments and send reminders
 */
export const checkUpcomingAppointments = (appointments) => {
    const now = new Date();

    appointments.forEach(appt => {
        const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
        const timeDiff = apptDateTime - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // 24 hours before
        if (hoursDiff > 23 && hoursDiff <= 24 && appt.status === 'confirmed') {
            const title = '⏰ Tomorrow\'s Appointment!';
            const body = `Don't forget! You have an appointment with Dr. ${appt.doctors?.name} tomorrow at ${appt.appointment_time}. Get a good night's sleep!`;

            if (Notification.permission === 'granted') {
                showInstantNotification(title, body);
            }
        }

        // 1 hour before
        if (hoursDiff > 0 && hoursDiff <= 1 && appt.status === 'confirmed') {
            const title = '🏥 Appointment in 1 Hour!';
            let body = `Time to get ready! Your appointment with Dr. ${appt.doctors?.name} starts in 1 hour`;

            if (appt.consultation_type === 'telemedicine') {
                body += '. Make sure your internet connection is stable!';
            } else {
                body += '. Leave now to avoid traffic!';
            }

            if (Notification.permission === 'granted') {
                showInstantNotification(title, body);
            }

            toast(body, {
                duration: 8000,
                icon: '⏰'
            });
        }

        // 15 minutes before telemedicine - show join button
        if (hoursDiff > 0 && hoursDiff <= 0.25 && appt.consultation_type === 'telemedicine' && appt.status === 'confirmed') {
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <p className="font-bold">🎥 Your video consultation is starting soon!</p>
                    <p className="text-sm">Dr. {appt.doctors?.name} is waiting</p>
                    <button
                        onClick={() => {
                            window.location.href = `/patient/telemedicine/${appt.id}`;
                            toast.dismiss(t.id);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700"
                    >
                        Join Now 🚀
                    </button>
                </div>
            ), {
                duration: 60000,
                icon: '🎥'
            });
        }
    });
};

/**
 * Notify doctor of new appointment
 */
export const notifyDoctorNewAppointment = (appointment, patient) => {
    const title = '👤 New Patient Appointment!';
    const body = `${patient.name} has booked an appointment for ${appointment.appointment_date} at ${appointment.appointment_time}. Get ready to help!`;

    if (Notification.permission === 'granted') {
        showInstantNotification(title, body);
    }

    toast.success(body, {
        duration: 5000,
        icon: '👤'
    });
};

/**
 * Notify when lab test is booked
 */
export const notifyLabTestBooked = (booking, lab) => {
    const title = '🔬 Lab Test Booked!';
    const body = `Perfect! Your ${booking.test_type} is scheduled at ${lab.name} for ${booking.test_date}. Stay healthy!`;

    if (Notification.permission === 'granted') {
        showInstantNotification(title, body);
    }

    toast.success(body, {
        duration: 5000,
        icon: '🔬'
    });
};

/**
 * Notify when lab report is ready
 */
export const notifyLabReportReady = (report, lab) => {
    const title = '📄 Your Report is Ready!';
    const body = `Good news! Your ${report.test_type} report from ${lab.name} is now available. Check it out!`;

    if (Notification.permission === 'granted') {
        showInstantNotification(title, body);
    }

    toast.success(body, {
        duration: 5000,
        icon: '📄'
    });
};
