// Maps AiNoviro categories to Cyprus Atlas directory category slugs
// Used for categories that OpenStreetMap doesn't cover well (service-based businesses)

const directoryCategoryMap = {
    "health_wellness": {
        label: "Health & Wellness",
        slugs: [
            "neurologists",
            "urologists",
            "occupational_therapists",
            "family_counsellors",
            "family_mediators",
            "acupuncture",
            "medical_practitioners_nephrologists",
            "medical_practitioners_radiologists",
            "medical_practitioners_vascular_surgeons",
            "doctors_paediatricians"
        ]
    },
    "professional_business": {
        label: "Professional & Business Services",
        slugs: [
            "accountants",
            "accounting_firms",
            "financial_%26_economic_consultants",
            "management_consultants",
            "international_business_unit_services_%26_consultants",
            "businesses_offering_services_abroad",
            "ecommerce-solutions",
            "eshop_web_design",
            "office_cleaning",
            "office_design"
        ]
    },
    "education_coaching": {
        label: "Education & Coaching",
        slugs: [
            "accounting_lessons",
            "dance_schools",
            "hairdressing_schools",
            "yoga-lessons",
            "karate_schools",
            "taekwondo_schools",
            "judo_schools",
            "navigation_%26_sailing_schools",
            "universities_",
            "schools"
        ]
    },
    "events_experiences": {
        label: "Events & Experiences",
        slugs: [
            "makeup_artists",
            "reception_halls",
            "magician",
            "radio_productions",
            "gaming-streamers"
        ]
    },
    "legal_financial_insurance": {
        label: "Legal, Financial & Insurance",
        slugs: [
            "advocates",
            "famil_law",
            "immigration_law",
            "accountants_%26_auditors",
            "quantity_surveyors",
            "quantity_surveyors_chartered"
        ]
    },
    "specialized_industries": {
        label: "Specialized Industries",
        slugs: [
            "yacht_engineers",
            "machine_shops",
            "machinery",
            "laboratories_testing_%26_calibration",
            "quarries",
            "farms_%26_farmers",
            "calibration_services"
        ]
    }
};

module.exports = directoryCategoryMap;