from api.models import FacilitiesPageSettings

def update_hero():
    settings = FacilitiesPageSettings.objects.first()
    if not settings:
        print("No settings found!")
        return

    print("--- CURRENT HERO TITLE ---")
    print(settings.hero_title)
    print("--- CURRENT SUBTEXT 1 ---")
    print(settings.hero_subtext_1)
    print("--- CURRENT SUBTEXT 2 ---")
    print(settings.hero_subtext_2)

    # Requested content
    settings.hero_title = "Facilities & Infrastructure Built for Sponsor-Ready Research"
    settings.hero_subtext_1 = "Integrated, regulatory-compliant infrastructure supporting preclinical discovery through human clinical trials."
    settings.hero_subtext_2 = "Designed for scientific rigor, scalability, and decision-grade data."
    settings.save()

    print("\n--- UPDATED HERO TITLE ---")
    print(settings.hero_title)
    print("--- UPDATED SUBTEXT 1 ---")
    print(settings.hero_subtext_1)
    print("--- UPDATED SUBTEXT 2 ---")
    print(settings.hero_subtext_2)

update_hero()
