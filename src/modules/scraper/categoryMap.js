// Maps AiNoviro categories to OpenStreetMap tags for Cyprus business scraping
const categoryMap = {
    "personal_care_beauty": {
        label: "Personal Care & Beauty",
        osmTags: [
            'shop=hairdresser',
            'shop=beauty',
            'shop=cosmetics',
            'shop=massage',
            'amenity=spa'
        ]
    },
    "health_wellness": {
        label: "Health & Wellness",
        osmTags: [
            'amenity=clinic',
            'amenity=dentist',
            'healthcare=physiotherapist',
            'healthcare=psychotherapist',
            'shop=medical_supply',
            'shop=nutrition_supplements'
        ]
    },
    "fitness_sports": {
        label: "Fitness & Sports",
        osmTags: [
            'leisure=fitness_centre',
            'sport=yoga',
            'shop=sports',
            'leisure=sports_centre'
        ]
    },
    "home_lifestyle_pets": {
        label: "Home & Lifestyle & Pets",
        osmTags: [
            'shop=pet',
            'amenity=veterinary',
            'shop=furniture',
            'craft=gardener',
            'craft=plumber',
            'craft=electrician',
            'shop=interior_decoration'
        ]
    },
    "professional_business": {
        label: "Professional & Business Services",
        osmTags: [
            'office=consulting',
            'office=accountant',
            'office=it',
            'office=advertising_agency',
            'office=coworking'
        ]
    },
    "education_coaching": {
        label: "Education & Coaching",
        osmTags: [
            'amenity=language_school',
            'amenity=driving_school',
            'office=educational_institution',
            'shop=books'
        ]
    },
    "events_experiences": {
        label: "Events & Experiences",
        osmTags: [
            'office=event_management',
            'amenity=events_venue',
            'shop=photo'
        ]
    },
    "retail_electronics": {
        label: "Retail & Electronics",
        osmTags: [
            'shop=electronics',
            'shop=mobile_phone',
            'shop=computer',
            'shop=appliance',
            'shop=clothes',
            'shop=shoes',
            'craft=electronics_repair'
        ]
    },
    "legal_financial_insurance": {
        label: "Legal, Financial & Insurance",
        osmTags: [
            'office=lawyer',
            'office=accountant',
            'office=insurance',
            'office=financial_advisor',
            'amenity=bank'
        ]
    },
    "automotive_mobility": {
        label: "Automotive & Mobility",
        osmTags: [
            'shop=car_repair',
            'shop=car',
            'shop=car_parts',
            'amenity=car_rental',
            'amenity=charging_station'
        ]
    },
    "travel_hospitality": {
        label: "Travel & Hospitality",
        osmTags: [
            'tourism=hotel',
            'tourism=guest_house',
            'tourism=travel_agency',
            'amenity=car_rental'
        ]
    },
    "food_beverage": {
        label: "Food & Beverage",
        osmTags: [
            'amenity=restaurant',
            'amenity=cafe',
            'amenity=bar',
            'amenity=fast_food',
            'shop=bakery',
            'shop=wine'
        ]
    },
    "real_estate": {
        label: "Real Estate & Property",
        osmTags: [
            'office=estate_agent',
            'office=property_management'
        ]
    },
    "specialized_industries": {
        label: "Specialized Industries",
        osmTags: [
            'office=engineer',
            'shop=industrial',
            'craft=*'
        ]
    }
};

module.exports = categoryMap;