# הלמידה של יערה

אתר תרגול סטטי (HTML/CSS/JS בלבד, בלי build), מתאים ל-GitHub Pages.

- `index.html` – דף הבית + חשבון, אנגלית, ספורט, שפה
- `dictation.html` – הכתבה באנגלית
- `worksheet.html` – תרגילי חשבון קבועים לקראת המבחן
- `hall.html` – היכל התהילה (דורש כניסה והזמנה)
- `admin.html` – יצירת קישורי הזמנה וניהול חברים (מנהלת בלבד)

ההתקדמות והמילים נשמרות ב-`localStorage` של הדפדפן.

## כניסה והיכל התהילה

כמו ב-shelf-awareness: **Firebase Authentication (Google)** + **Firestore**, בהזמנה בלבד.
המשחקים פתוחים לכולם; כניסה נדרשת רק כדי להגדיר פרופיל (שם ודמות) ולפרסם תוצאות.
בסוף סיבוב עם שיא אישי חדש מופיע כפתור "פרסום בהיכל התהילה".

```
js/honey.js            הכניסה, הפרופיל והכפתור הצף (נטען בכל עמוד, חושף window.Honey)
js/fb.js               backend של Firebase
js/demo.js             backend מקומי להדגמה (מוסיפים ?demo לכל כתובת)
js/firebase-config.js  הגדרות הפרויקט + מייל המנהלת
firestore.rules        כללי גישה: להדביק בקונסולת Firebase
```

| נתיב ב-Firestore | תוכן | מי קורא / כותב |
|---|---|---|
| `members/{email}` | רשימת המוזמנים | מנהלת; כל אחת קוראת את עצמה |
| `invites/{code}` | קישורי הזמנה חד-פעמיים | מנהלת; מוזמנת מממשת אחד לעצמה |
| `profiles/{uid}` | שם ודמות | חברים קוראים, כל אחת כותבת את שלה |
| `scores/{uid}_{game}` | השיא האישי (`math`, `worksheet`, `dictation`, `quiz`) | חברים קוראים; כל אחת כותבת את שלה, ורק שיפור |

### הקמה חד-פעמית

1. **Firebase**: צרו פרויקט חדש ב-console.firebase.google.com (בלי Analytics).
2. **Authentication** → Sign-in method → הפעילו **Google**. ב-Settings → Authorized domains ודאו ש-`wolfenfeld.github.io` ברשימה.
3. **Firestore Database** → Create database (production mode). בלשונית Rules הדביקו את `firestore.rules` ולחצו Publish.
4. **Project settings** → Your apps → הוסיפו **Web app** והעתיקו את ההגדרות אל `js/firebase-config.js`.
5. דחפו ל-`main`. נכנסים לאתר כמנהלת, ופותחים את `admin.html` ליצירת קישורי הזמנה.

כל עוד ב-`firebase-config.js` כתוב `REPLACE_ME`, הכניסה וההיכל כבויים והאתר עובד כרגיל.

### בדיקה מקומית

```bash
python3 -m http.server 8765
```

ופותחים `http://localhost:8765/hall.html?demo`. מצב ההדגמה שומר הכול בדפדפן ומציג שחקנים לדוגמה.
