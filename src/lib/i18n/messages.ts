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
  onboarding: {
    welcome: string;            // "Welcome, {name}"
    employeeId: string;         // "Employee ID"
    faceRequiredTitle: string;
    faceRequiredBody: string;
    instructionsTitle: string;
    instr1: string;
    instr2: string;
    instr3: string;
    instr4: string;
    registerButton: string;
    back: string;
    doneTitle: string;
    redirecting: string;
  };
  home: {
    morning: string;
    afternoon: string;
    evening: string;
    loading: string;
    stepFace: string;
    stepFaceDone: string;
    stepFacePending: string;
    stepFaceAction: string;
    stepAttendance: string;
    stepAttendancePending: string;
    stepAttendanceAction: string;
    stepAttendanceVerifiedAt: string;
    stepShiftStart: string;
    stepShiftStartPending: string;
    stepShiftStartAction: string;
    stepShiftEnd: string;
    stepShiftEndPending: string;
    stepShiftEndAction: string;
    stepRoute: string;
    stepRouteCompleted: string;
    stepRoutePercentSuffix: string;
    stepRouteAction: string;
    stepRouteViewDetails: string;
    submittedAt: string;
    verifiedSuffix: string;
    checkpointPhotosSuffix: string;
    allDoneTitle: string;
    allDoneSub: string;
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
    onboarding: {
      welcome: 'Welcome',
      employeeId: 'Employee ID',
      faceRequiredTitle: 'Face Registration Required',
      faceRequiredBody:
        'Before you can mark attendance or take geotagged photos, you need to register your face. This is a one-time process. Your photo will be used to verify your identity at job sites.',
      instructionsTitle: 'Instructions:',
      instr1: 'Face the front camera directly - clear, well-lit photo',
      instr2: 'Remove sunglasses, hats, or anything covering your face',
      instr3: 'Wait for the green border - it means your face is detected',
      instr4: 'Tap capture - your face embedding will be saved securely',
      registerButton: 'Register My Face',
      back: 'Back',
      doneTitle: 'Face Registered!',
      redirecting: 'Redirecting you to mark attendance...',
    },
    home: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
      loading: 'Loading your daily status...',
      stepFace: 'Face Registration',
      stepFaceDone: 'Registered',
      stepFacePending: 'Required before check-in',
      stepFaceAction: 'Register Face',
      stepAttendance: 'Mark Attendance',
      stepAttendancePending: 'GPS attendance check-in',
      stepAttendanceAction: 'Mark Now',
      stepAttendanceVerifiedAt: 'Verified at',
      stepShiftStart: 'Shift Start Photo',
      stepShiftStartPending: 'Face-verified shift start photo',
      stepShiftStartAction: 'Take Photo',
      stepShiftEnd: 'Shift End Photo',
      stepShiftEndPending: 'Face-verified shift end photo',
      stepShiftEndAction: 'Take Photo',
      stepRoute: 'Route Progress',
      stepRouteCompleted: 'Route completed',
      stepRoutePercentSuffix: '% complete',
      stepRouteAction: 'View Progress',
      stepRouteViewDetails: 'View Details',
      submittedAt: 'Submitted at',
      verifiedSuffix: 'Verified',
      checkpointPhotosSuffix: 'checkpoint photos',
      allDoneTitle: 'All tasks completed!',
      allDoneSub: 'Great work today.',
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
    onboarding: {
      welcome: 'स्वागत है',
      employeeId: 'कर्मचारी आईडी',
      faceRequiredTitle: 'चेहरा पंजीकरण आवश्यक',
      faceRequiredBody:
        'हाज़िरी लगाने या जियो-टैग फ़ोटो लेने से पहले आपको अपना चेहरा पंजीकृत करना होगा। यह एक बार की प्रक्रिया है। आपकी फ़ोटो काम की जगह पर पहचान सत्यापन के लिए इस्तेमाल होगी।',
      instructionsTitle: 'निर्देश:',
      instr1: 'कैमरे के सामने सीधे देखें - साफ़ और अच्छी रोशनी वाली फ़ोटो',
      instr2: 'चश्मा, टोपी या चेहरा ढकने वाली कोई चीज़ हटा दें',
      instr3: 'हरी सीमा का इंतज़ार करें - इसका मतलब है आपका चेहरा पहचाना गया',
      instr4: 'कैप्चर दबाएँ - आपका चेहरा सुरक्षित रूप से सहेजा जाएगा',
      registerButton: 'मेरा चेहरा पंजीकृत करें',
      back: 'वापस',
      doneTitle: 'चेहरा पंजीकृत हो गया!',
      redirecting: 'आपको हाज़िरी पेज पर ले जाया जा रहा है...',
    },
    home: {
      morning: 'सुप्रभात',
      afternoon: 'नमस्ते',
      evening: 'शुभ संध्या',
      loading: 'आज की स्थिति लोड हो रही है...',
      stepFace: 'चेहरा पंजीकरण',
      stepFaceDone: 'पंजीकृत',
      stepFacePending: 'हाज़िरी से पहले ज़रूरी',
      stepFaceAction: 'चेहरा पंजीकृत करें',
      stepAttendance: 'हाज़िरी लगाएँ',
      stepAttendancePending: 'GPS हाज़िरी चेक-इन',
      stepAttendanceAction: 'अभी लगाएँ',
      stepAttendanceVerifiedAt: 'सत्यापित हुई',
      stepShiftStart: 'शिफ्ट शुरू फ़ोटो',
      stepShiftStartPending: 'चेहरा-सत्यापित शिफ्ट शुरू फ़ोटो',
      stepShiftStartAction: 'फ़ोटो लें',
      stepShiftEnd: 'शिफ्ट समाप्ति फ़ोटो',
      stepShiftEndPending: 'चेहरा-सत्यापित शिफ्ट समाप्ति फ़ोटो',
      stepShiftEndAction: 'फ़ोटो लें',
      stepRoute: 'रूट प्रगति',
      stepRouteCompleted: 'रूट पूरा हुआ',
      stepRoutePercentSuffix: '% पूरा',
      stepRouteAction: 'प्रगति देखें',
      stepRouteViewDetails: 'विवरण देखें',
      submittedAt: 'जमा हुई',
      verifiedSuffix: 'सत्यापित',
      checkpointPhotosSuffix: 'चेकपॉइंट फ़ोटो',
      allDoneTitle: 'सभी काम पूरे हो गए!',
      allDoneSub: 'आज शानदार काम।',
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
    onboarding: {
      welcome: 'स्वागत आहे',
      employeeId: 'कर्मचारी आयडी',
      faceRequiredTitle: 'चेहरा नोंदणी आवश्यक',
      faceRequiredBody:
        'हजेरी लावण्याआधी किंवा जिओ-टॅग फोटो काढण्याआधी तुम्हाला तुमचा चेहरा नोंदवावा लागेल. ही एकदाच करायची प्रक्रिया आहे. कामाच्या ठिकाणी ओळख पटवण्यासाठी तुमचा फोटो वापरला जाईल.',
      instructionsTitle: 'सूचना:',
      instr1: 'समोरच्या कॅमेऱ्याकडे थेट पाहा - स्पष्ट, चांगल्या उजेडातला फोटो',
      instr2: 'गॉगल, टोपी किंवा चेहरा झाकणारी कोणतीही गोष्ट काढा',
      instr3: 'हिरव्या किनारीची वाट पहा - म्हणजे तुमचा चेहरा ओळखला गेला',
      instr4: 'कॅप्चर दाबा - तुमचा चेहरा सुरक्षितपणे जतन होईल',
      registerButton: 'माझा चेहरा नोंदवा',
      back: 'मागे',
      doneTitle: 'चेहरा नोंदला गेला!',
      redirecting: 'तुम्हाला हजेरी पानावर नेले जात आहे...',
    },
    home: {
      morning: 'सुप्रभात',
      afternoon: 'नमस्कार',
      evening: 'शुभ संध्याकाळ',
      loading: 'आजची स्थिती लोड होत आहे...',
      stepFace: 'चेहरा नोंदणी',
      stepFaceDone: 'नोंदले',
      stepFacePending: 'हजेरीआधी आवश्यक',
      stepFaceAction: 'चेहरा नोंदवा',
      stepAttendance: 'हजेरी लावा',
      stepAttendancePending: 'GPS हजेरी चेक-इन',
      stepAttendanceAction: 'आता लावा',
      stepAttendanceVerifiedAt: 'पडताळणी झाली',
      stepShiftStart: 'शिफ्ट सुरू फोटो',
      stepShiftStartPending: 'चेहरा-पडताळलेला शिफ्ट सुरू फोटो',
      stepShiftStartAction: 'फोटो काढा',
      stepShiftEnd: 'शिफ्ट संपण्याचा फोटो',
      stepShiftEndPending: 'चेहरा-पडताळलेला शिफ्ट संपण्याचा फोटो',
      stepShiftEndAction: 'फोटो काढा',
      stepRoute: 'मार्ग प्रगती',
      stepRouteCompleted: 'मार्ग पूर्ण झाला',
      stepRoutePercentSuffix: '% पूर्ण',
      stepRouteAction: 'प्रगती पहा',
      stepRouteViewDetails: 'तपशील पहा',
      submittedAt: 'दाखल केले',
      verifiedSuffix: 'पडताळलेले',
      checkpointPhotosSuffix: 'चेकपॉइंट फोटो',
      allDoneTitle: 'सर्व कामे पूर्ण!',
      allDoneSub: 'आजचे काम छान झाले.',
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
