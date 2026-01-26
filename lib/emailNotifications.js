/**
 * Email Notification System
 * Handles sending email notifications for appointments and progress reports
 * Uses Supabase Edge Functions or direct email service integration
 */

import { supabase } from './supabase';

/**
 * Send appointment confirmation email to both patient and doctor
 * @param {Object} appointment - Appointment data
 * @param {Object} patient - Patient data
 * @param {Object} doctor - Doctor data
 */
export async function sendAppointmentConfirmation(appointment, patient, doctor) {
    try {
        // Format appointment details
        const appointmentDetails = {
            patientName: patient.name,
            patientEmail: patient.email,
            patientPhone: patient.phone,
            doctorName: doctor.name,
            doctorEmail: doctor.email,
            appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            appointmentTime: appointment.appointment_time,
            consultationType: appointment.consultation_type || 'In-Person',
            status: appointment.status
        };

        // Email content for patient
        const patientEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #602E5A;">Appointment Confirmed</h2>
        <p>Dear ${patient.name},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctor.name}</p>
          <p><strong>Date:</strong> ${appointmentDetails.appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentDetails.appointmentTime}</p>
          <p><strong>Type:</strong> ${appointmentDetails.consultationType}</p>
        </div>
        <p>Please arrive 10 minutes early for your appointment.</p>
        <p>Best regards,<br>HealthON Team</p>
      </div>
    `;

        // Email content for doctor
        const doctorEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #649488;">New Appointment Confirmed</h2>
        <p>Dear Dr. ${doctor.name},</p>
        <p>A new appointment has been confirmed:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>Patient:</strong> ${patient.name}</p>
          <p><strong>Phone:</strong> ${patient.phone}</p>
          <p><strong>Date:</strong> ${appointmentDetails.appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentDetails.appointmentTime}</p>
          <p><strong>Type:</strong> ${appointmentDetails.consultationType}</p>
        </div>
        <p>Best regards,<br>HealthON Team</p>
      </div>
    `;

        // Send emails using Supabase Edge Function or direct email service
        // Note: This requires setting up email service (SendGrid, Resend, etc.)

        // For now, we'll log the emails (replace with actual email service)
        console.log('📧 Sending appointment confirmation emails:');
        console.log('To Patient:', patient.email);
        console.log('To Doctor:', doctor.email);

        // TODO: Integrate with actual email service
        // Example with Supabase Edge Function:
        // await supabase.functions.invoke('send-email', {
        //   body: {
        //     to: patient.email,
        //     subject: 'Appointment Confirmed - HealthON',
        //     html: patientEmailContent
        //   }
        // });

        // Store notification in database for tracking
        await supabase.from('notifications').insert([
            {
                user_id: patient.user_id,
                type: 'appointment_confirmation',
                title: 'Appointment Confirmed',
                message: `Your appointment with Dr. ${doctor.name} on ${appointmentDetails.appointmentDate} at ${appointmentDetails.appointmentTime} has been confirmed.`,
                read: false
            },
            {
                user_id: doctor.user_id,
                type: 'appointment_confirmation',
                title: 'New Appointment',
                message: `New appointment with ${patient.name} on ${appointmentDetails.appointmentDate} at ${appointmentDetails.appointmentTime}.`,
                read: false
            }
        ]);

        return { success: true };
    } catch (error) {
        console.error('Error sending appointment confirmation:', error);
        return { success: false, error };
    }
}

/**
 * Send weekly progress report to patient and assigned doctor
 * @param {Object} report - Progress report data
 * @param {Object} patient - Patient data
 * @param {Object} doctor - Assigned doctor data
 */
export async function sendWeeklyProgressReport(report, patient, doctor) {
    try {
        const reportDate = new Date(report.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Email content for patient
        const patientEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #602E5A;">Your Weekly Health Progress Report</h2>
        <p>Dear ${patient.name},</p>
        <p>Your weekly health progress report for ${reportDate} is ready.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>Report Summary:</strong></p>
          <p>${report.summary || 'Your health data has been analyzed for this week.'}</p>
        </div>
        <p>Log in to your HealthON dashboard to view the complete report.</p>
        <p>Best regards,<br>HealthON Team</p>
      </div>
    `;

        // Email content for doctor (only assigned doctor)
        const doctorEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #649488;">Patient Progress Report</h2>
        <p>Dear Dr. ${doctor.name},</p>
        <p>A weekly progress report for your patient ${patient.name} is available.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>Patient:</strong> ${patient.name}</p>
          <p><strong>Report Date:</strong> ${reportDate}</p>
          <p><strong>Summary:</strong> ${report.summary || 'Health data analyzed for this week.'}</p>
        </div>
        <p>Log in to your HealthON portal to review the complete report.</p>
        <p>Best regards,<br>HealthON Team</p>
      </div>
    `;

        console.log('📧 Sending weekly progress report emails:');
        console.log('To Patient:', patient.email);
        console.log('To Doctor:', doctor.email);

        // Store notification in database
        await supabase.from('notifications').insert([
            {
                user_id: patient.user_id,
                type: 'progress_report',
                title: 'Weekly Progress Report Ready',
                message: `Your weekly health progress report for ${reportDate} is now available.`,
                read: false
            },
            {
                user_id: doctor.user_id,
                type: 'progress_report',
                title: 'Patient Progress Report',
                message: `Weekly progress report for ${patient.name} is now available.`,
                read: false
            }
        ]);

        return { success: true };
    } catch (error) {
        console.error('Error sending weekly progress report:', error);
        return { success: false, error };
    }
}

/**
 * Send prescription notification to patient
 * @param {Object} prescription - Prescription data
 * @param {Object} patient - Patient data
 * @param {Object} doctor - Doctor data
 */
export async function sendPrescriptionNotification(prescription, patient, doctor) {
    try {
        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #602E5A;">New Prescription Available</h2>
        <p>Dear ${patient.name},</p>
        <p>Dr. ${doctor.name} has shared a new prescription with you.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
          <p><strong>Medications:</strong> ${prescription.medications?.length || 0} prescribed</p>
        </div>
        <p>Log in to your HealthON dashboard to view the complete prescription and set up medication reminders.</p>
        <p>Best regards,<br>HealthON Team</p>
      </div>
    `;

        console.log('📧 Sending prescription notification to:', patient.email);

        // Store notification
        await supabase.from('notifications').insert({
            user_id: patient.user_id,
            type: 'prescription',
            title: 'New Prescription',
            message: `Dr. ${doctor.name} has shared a new prescription with you.`,
            read: false
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending prescription notification:', error);
        return { success: false, error };
    }
}
