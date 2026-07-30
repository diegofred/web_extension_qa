Brief description: 
Invite modal is a modal form to send invitations with the following specifications:
- Submit Button name: "Send Invitation" 
- Modal title: "Invite to Apply" 
- Modal fields: 
  - First Name (required)
  - Last Name (required)
  - Email Address (required)
  - Phone Number(optional)
  - Language selector: ["EN", "ES"] with default in "EN"
- Modal buttons: 
  - "Send Invitation"
  - X (closes the modal)
- Modal validation: 
  - Email must be a valid email address

- Modal Footer
    - Contain a Invite URL fixed value: like https://rentbutter.com/apply/buttertwo with a click able copy board icon


  Action Flow:
  - User clicks "Invite" button in Dashboard Section
  - Modal opens
  - User fills in the form
  - User clicks "Send Invitation" button
  - Modal closes and shows a success message in Green banner format 

- Modal success: 
  - Closes the modal and shows a success message
- Modal error: 
  - Shows an error message in some place 
  - Show input validation errors for required wrong inputs

