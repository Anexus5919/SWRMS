/**
 * SWRMS staff-PWA message catalogue.
 *
 * Locales: English (en), Hindi (hi), Marathi (mr).
 *
 * Scope: only the strings staff (low-literacy field workers) actually
 * see. Supervisor and admin dashboards stay English — those users are
 * office-based and literate.
 *
 * Adding a new key:
 *   1. Add it to `Messages` below in en first.
 *   2. Add the same key to `hi` and `mr`. Use a Marathi/Hindi translator
 *      for any new copy — do NOT machine-translate without review.
 *   3. Reference via `t('key.path')` in components.
 */

export const SUPPORTED_LOCALES = ['en', 'hi', 'mr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
};

// Each top-level key is a logical area. Flat strings make the lookup
// O(1) and avoid pluralisation library overhead — adequate for the
// short, action-oriented copy on the staff PWA.

export interface Messages {
  nav: {
    home: string;
    attendance: string;
    photo: string;
    myRoute: string;
    progress: string;
  };
  tracking: {
    title: string;
    on: string;
    off: string;
    explainerOff: string;
    explainerOn: string;
    onRoute: string;
    offRoute: string;
    offRouteAction: string;
    metresFromPath: string;
    lastUpdate: string;
    mockLocationWarn: string;
    pausedPrefix: string;
    startButton: string;
    stopButton: string;
    routeCompleted: string;
    markAttendanceFirst: string;
  };
  unavail: {
    title: string;
    explainer: string;
    sick: string;
    personal: string;
    transport: string;
    other: string;
    declared: string;
    confirm: string;
    cancel: string;
  };
  errors: {
    generic: string;
    network: string;
    permission: string;
  };
  common: {
    yes: string;
    no: string;
    loading: string;
    save: string;
    close: string;
    language: string;
  };
}

export const messages: Record<Locale, Messages> = {
  en: {
    nav: {
      home: 'Home',
      attendance: 'Attendance',
      photo: 'Photo',
      myRoute: 'My Route',
      progress: 'Progress',
    },
    tracking: {
      title: 'Live Tracking',
      on: 'ON',
      off: 'OFF',
      explainerOff:
        'Press Start Shift to share your location with the supervisor while you work. You can stop any time.',
      explainerOn:
        'Your location is being shared with your supervisor while you complete the route.',
      onRoute: 'On route',
      offRoute: 'Off route',
      offRouteAction: 'You are far from the assigned path. Return to the route.',
      metresFromPath: 'm from path',
      lastUpdate: 'last update',
      mockLocationWarn:
        'Warning: Your device is reporting a mock-location flag. This will be reviewed by the supervisor. If you have a fake-GPS app installed, please disable it.',
      pausedPrefix: 'Paused',
      startButton: 'Start Shift Tracking',
      stopButton: 'Stop Tracking',
      routeCompleted: 'Route Completed',
      markAttendanceFirst: 'Mark Attendance First',
    },
    unavail: {
      title: 'Unable to work today?',
      explainer:
        'Tap a reason below to let your supervisor know. They will arrange someone else to cover your route.',
      sick: 'Sick',
      personal: 'Personal',
      transport: 'No Transport',
      other: 'Other',
      declared: 'You marked yourself unavailable today.',
      confirm: 'Confirm',
      cancel: 'Cancel',
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      network: 'No internet. We will retry automatically.',
      permission: 'Permission denied. Please allow GPS / Camera in your browser settings.',
    },
    common: {
      yes: 'Yes',
      no: 'No',
      loading: 'Loading...',
      save: 'Save',
      close: 'Close',
      language: 'Language',
    },
  },
  hi: {
    nav: {
      home: 'मुख्य',
      attendance: 'हाज़िरी',
      photo: 'फ़ोटो',
      myRoute: 'मेरा रूट',
      progress: 'प्रगति',
    },
    tracking: {
      title: 'लाइव ट्रैकिंग',
      on: 'चालू',
      off: 'बंद',
      explainerOff:
        'काम के समय अपना स्थान सुपरवाइज़र को बताने के लिए "शिफ्ट शुरू करें" दबाएँ। आप कभी भी रोक सकते हैं।',
      explainerOn:
        'जब तक आप रूट पूरा नहीं करते, आपकी लोकेशन सुपरवाइज़र को दिख रही है।',
      onRoute: 'रूट पर',
      offRoute: 'रूट से बाहर',
      offRouteAction: 'आप तय किए गए रास्ते से दूर हैं। कृपया रूट पर वापस आएँ।',
      metresFromPath: 'मीटर रास्ते से',
      lastUpdate: 'अंतिम अपडेट',
      mockLocationWarn:
        'चेतावनी: आपके फ़ोन ने नकली-लोकेशन का संकेत दिया है। इसकी समीक्षा सुपरवाइज़र करेंगे। अगर आपके फ़ोन में फ़ेक-GPS ऐप है, कृपया उसे हटाएँ।',
      pausedPrefix: 'रुका हुआ',
      startButton: 'शिफ्ट ट्रैकिंग शुरू करें',
      stopButton: 'ट्रैकिंग बंद करें',
      routeCompleted: 'रूट पूरा हुआ',
      markAttendanceFirst: 'पहले हाज़िरी लगाएँ',
    },
    unavail: {
      title: 'आज काम नहीं कर सकते?',
      explainer:
        'कारण चुनिए ताकि सुपरवाइज़र को पता चले। वे आपके रूट के लिए दूसरा साथी लगा देंगे।',
      sick: 'बीमार',
      personal: 'निजी',
      transport: 'गाड़ी नहीं',
      other: 'अन्य',
      declared: 'आपने आज को अनुपलब्ध दर्ज किया है।',
      confirm: 'पुष्टि करें',
      cancel: 'रद्द करें',
    },
    errors: {
      generic: 'कुछ गड़बड़ हुई। कृपया फिर कोशिश करें।',
      network: 'इंटरनेट नहीं है। हम अपने आप दुबारा कोशिश करेंगे।',
      permission: 'अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में GPS / कैमरा चालू करें।',
    },
    common: {
      yes: 'हाँ',
      no: 'नहीं',
      loading: 'लोड हो रहा है...',
      save: 'सेव करें',
      close: 'बंद करें',
      language: 'भाषा',
    },
  },
  mr: {
    nav: {
      home: 'मुख्य',
      attendance: 'हजेरी',
      photo: 'फोटो',
      myRoute: 'माझा मार्ग',
      progress: 'प्रगती',
    },
    tracking: {
      title: 'लाइव्ह ट्रॅकिंग',
      on: 'सुरू',
      off: 'बंद',
      explainerOff:
        'कामाच्या वेळी तुमचे स्थान सुपरवायझरला कळविण्यासाठी "शिफ्ट सुरू करा" दाबा. तुम्ही केव्हाही थांबवू शकता.',
      explainerOn:
        'जोपर्यंत तुम्ही मार्ग पूर्ण करत नाही तोपर्यंत तुमचे लोकेशन सुपरवायझरला दिसत आहे.',
      onRoute: 'मार्गावर',
      offRoute: 'मार्गाबाहेर',
      offRouteAction: 'तुम्ही नेमलेल्या मार्गापासून दूर आहात. कृपया मार्गावर परत या.',
      metresFromPath: 'मीटर मार्गापासून',
      lastUpdate: 'शेवटचा अपडेट',
      mockLocationWarn:
        'सावधान: तुमच्या फोनने खोटे-लोकेशन ध्वज दर्शवला आहे. सुपरवायझर याची तपासणी करतील. तुमच्या फोनवर फेक-GPS अ‍ॅप असेल तर कृपया तो काढून टाका.',
      pausedPrefix: 'थांबविले',
      startButton: 'शिफ्ट ट्रॅकिंग सुरू करा',
      stopButton: 'ट्रॅकिंग बंद करा',
      routeCompleted: 'मार्ग पूर्ण झाला',
      markAttendanceFirst: 'आधी हजेरी लावा',
    },
    unavail: {
      title: 'आज काम करू शकत नाही?',
      explainer:
        'कारण निवडा जेणेकरून सुपरवायझरला कळेल. ते तुमच्या मार्गासाठी दुसरा कामगार पाठवतील.',
      sick: 'आजारी',
      personal: 'वैयक्तिक',
      transport: 'वाहन नाही',
      other: 'इतर',
      declared: 'तुम्ही आज अनुपलब्ध असल्याचे नोंदवले आहे.',
      confirm: 'पुष्टी करा',
      cancel: 'रद्द करा',
    },
    errors: {
      generic: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      network: 'इंटरनेट नाही. आम्ही आपोआप पुन्हा प्रयत्न करू.',
      permission: 'परवानगी नाकारली. कृपया ब्राउझर सेटिंग्जमध्ये GPS / कॅमेरा चालू करा.',
    },
    common: {
      yes: 'होय',
      no: 'नाही',
      loading: 'लोड होत आहे...',
      save: 'जतन करा',
      close: 'बंद करा',
      language: 'भाषा',
    },
  },
};

/**
 * Resolve a dotted key like "tracking.startButton" against a Messages tree.
 * Returns the key itself if not found so missing translations are visible
 * in the UI rather than silently disappearing.
 */
export function lookup(messages: Messages, key: string): string {
  const parts = key.split('.');
  let cursor: unknown = messages;
  for (const p of parts) {
    if (cursor && typeof cursor === 'object' && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof cursor === 'string' ? cursor : key;
}
