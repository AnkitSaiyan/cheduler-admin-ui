import { DUTCH_BE, ENG_BE } from '../utils/const';

export const Translate = Object.freeze({
  // Table Headers
  FirstName: {
    [ENG_BE]: 'First Name',
    [DUTCH_BE]: 'Voornaam',
  },
  LastName: {
    [ENG_BE]: 'Last Name',
    [DUTCH_BE]: 'Naam',
  },
  Email: {
    [ENG_BE]: 'Email',
    [DUTCH_BE]: 'E-mail',
  },
  Status: {
    [ENG_BE]: 'Status',
    [DUTCH_BE]: 'Status',
  },
  Actions: {
    [ENG_BE]: 'Actions',
    [DUTCH_BE]: 'Acties',
  },

  // Statuses
  Active: {
    [ENG_BE]: 'Active',
    [DUTCH_BE]: 'Actief',
  },

  Inactive: {
    [ENG_BE]: 'Inactive',
    [DUTCH_BE]: 'Inactief',
  },

  Telephone: {
    [ENG_BE]: 'Telephone',
    [DUTCH_BE]: 'Telefoon',
  },

  Category: {
    [ENG_BE]: 'Category',
    [DUTCH_BE]: 'Categorie',
  },
  CSV: {
    [ENG_BE]: 'CSV',
    [DUTCH_BE]: 'CSV',
  },
  Excel: {
    [ENG_BE]: 'Excel',
    [DUTCH_BE]: 'Excel',
  },
  PDF: {
    [ENG_BE]: 'PDF',
    [DUTCH_BE]: 'PDF',
  },
  Print: {
    [ENG_BE]: 'Print',
    [DUTCH_BE]: 'Afdrukken',
  },
  Title: {
    [ENG_BE]: 'Title',
    [DUTCH_BE]: 'Titel',
  },
  StartDate: {
    [ENG_BE]: 'Start Date',
    [DUTCH_BE]: 'Begin Datum',
  },
  EndDate: {
    [ENG_BE]: 'End Date',
    [DUTCH_BE]: 'Eind Datum',
  },
  AbsenceInfo: {
    [ENG_BE]: 'Absence Info',
    [DUTCH_BE]: 'Info Afwezigheid',
  },
  Start: {
    [ENG_BE]: 'Start',
    [DUTCH_BE]: 'Begin',
  },
  End: {
    [ENG_BE]: 'End',
    [DUTCH_BE]: 'Eind',
  },
  Priority: {
    [ENG_BE]: 'Priority',
    [DUTCH_BE]: 'Prioriteit',
  },
  Name: {
    [ENG_BE]: 'Name',
    [DUTCH_BE]: 'Naam',
  },
  Expensive: {
    [ENG_BE]: 'Expensive',
    [DUTCH_BE]: 'Duur',
  },
  Type: {
    [ENG_BE]: 'Type',
    [DUTCH_BE]: 'Vul in',
  },
  Description: {
    [ENG_BE]: 'Description',
    [DUTCH_BE]: 'Beschrijving',
  },
  PlaceInAgenda: {
    [ENG_BE]: 'Place In Agenda',
    [DUTCH_BE]: 'Plaats in agenda',
  },
  StartedAt: {
    [ENG_BE]: 'Started At',
    [DUTCH_BE]: 'Begon bij',
  },
  EndedAt: {
    [ENG_BE]: 'Ended At',
    [DUTCH_BE]: 'Geëindigd om',
  },
  PatientName: {
    [ENG_BE]: 'Patient Name',
    [DUTCH_BE]: 'Naam patiënt',
  },
  Doctor: {
    [ENG_BE]: 'Doctor',
    [DUTCH_BE]: 'Docter',
  },
  AppointmentNo: {
    [ENG_BE]: 'Appointment No',
    [DUTCH_BE]: 'Afspraak nr.',
  },
  AppliedOn: {
    [ENG_BE]: 'Applied On',
    [DUTCH_BE]: 'Toegepast op',
  },
  Read: {
    [ENG_BE]: 'Read',
    [DUTCH_BE]: 'Lees',
  },

  // Toast Messages
  DownloadSuccess: (filetype) => ({
    [ENG_BE]: `${filetype} file downloaded successfully`,
    [DUTCH_BE]: `${filetype} bestand succesvol gedownload`,
  }),

  DeleteSuccess: (filetype) => ({
    [ENG_BE]: `${filetype} Deleted successfully`,
    [DUTCH_BE]: `${filetype} Succesvol Verwijderd`,
  }),

  AddedSuccess: (filetype) => ({
    [ENG_BE]: `${filetype}Added successfully`,
    [DUTCH_BE]: `${filetype} Succesvol toegevoegd`,
  }),

  EditSuccess: (filetype) => ({
    [ENG_BE]: `${filetype} Updated successfully`,
    [DUTCH_BE]: `${filetype}Succesvol geüpdated`,
  }),

  SuccessMessage: {
    StatusChanged: {
      [ENG_BE]: 'Status has changed successfully',
      [DUTCH_BE]: 'Status succesvol verandert',
    },
    Deleted: {
      [ENG_BE]: 'Deleted successfully',
      [DUTCH_BE]: 'Succesvol Verwijderd',
    },
    Updated: {
      [ENG_BE]: 'Updated successfully',
      [DUTCH_BE]: 'Succesvol geüpdated',
    },
    Added: {
      [ENG_BE]: 'Added successfully',
      [DUTCH_BE]: 'Succesvol toegevoegd',
    },
    CopyToClipboard: {
      [ENG_BE]: 'Data copied to clipboard successfully',
      [DUTCH_BE]: 'Gegevens succesvol naar clipboard gecopieerd',
    },
  },

  ErrorMessage: {
    CopyToClipboard: {
      [ENG_BE]: 'Failed to copy Data',
      [DUTCH_BE]: 'Gegevens succesvol naar clipboard gecopieerd',
    },
  },

  // Form Invalid
  FormInvalid: {
    [ENG_BE]: 'Form is not valid, please fill out the required fields',
    [DUTCH_BE]: 'Formulier is niet geldig, vul de verplichte velden in',
  },

  FormInvalidSimple: {
    [ENG_BE]: 'Form is not valid',
    [DUTCH_BE]: 'Formulier is niet geldig',
  },

  SelectSlots: {
    [ENG_BE]: 'Please select slots for all exams',
    [DUTCH_BE]: 'Selecteer slots voor alle examens',
  },

  FillSlot: {
    [ENG_BE]: 'Please fill current slot before adding new',
    [DUTCH_BE]: 'Formulier is niet geldig',
  },
});

