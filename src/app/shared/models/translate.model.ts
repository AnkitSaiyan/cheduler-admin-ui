import {DUTCH_BE, ENG_BE} from "../utils/const";

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

  // Toast Messages
  DownloadSuccess: (filetype) => ({
      [ENG_BE]: `${filetype} file downloaded successfully`,
      [DUTCH_BE]: `${filetype} bestand succesvol gedownload`,
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
    }
  },

  FormInvalid: {
    [ENG_BE]: 'Form is not valid, please fill out the required fields',
    [DUTCH_BE]: 'Formulier is niet geldig, vul de verplichte velden in'
  },
});
