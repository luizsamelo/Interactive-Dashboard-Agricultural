import pandas as pd
import pycountry
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia',
    'Australia', 'Austria', 'Azerbaijan', 'Brazil', 'Bulgaria', 'Cameroon',
    'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Ecuador', 'Egypt, Arab Rep.', 'Eritrea', 'Ethiopia',
    'France', 'Germany', 'Ghana', 'Greece', 'India', 'Indonesia', 'Iran, Islamic Rep.',
    'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
    'Lebanon', 'Malta', 'Mexico', 'Morocco', 'Pakistan', 'Peru', 'Philippines',
    'Russian Federation', 'Syrian Arab Republic', 'Tunisia', 'Turkey', 'Ukraine',
]

CSV_PATH = 'agriRuralDevelopment_cleaned.csv'


def build_iso_map(df):
    """Return {numeric_iso (int): country_name} derived from the CSV's Country Code column."""
    iso_map = {}
    for _, row in df[['Country Name', 'Country Code']].drop_duplicates().iterrows():
        country = pycountry.countries.get(alpha_3=row['Country Code'])
        if country:
            iso_map[int(country.numeric)] = row['Country Name']
    return iso_map


def load_filtered_data():
    df = pd.read_csv(CSV_PATH)
    return df[df['Country Name'].isin(COUNTRIES)].copy()


def compute_pca(df):
    most_recent_year = df['year'].max()
    df_year = df[df['year'] == most_recent_year].copy()

    feature_cols = [c for c in df_year.columns if c not in ('Country Name', 'Country Code', 'year')]
    df_features = df_year[feature_cols].dropna(axis=1, how='all')
    df_combined = pd.concat([df_year[['Country Name', 'Country Code']], df_features], axis=1).dropna()

    countries = df_combined['Country Name'].tolist()
    X = df_combined[df_features.columns.intersection(df_combined.columns)].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    pca = PCA(n_components=2)
    coords = pca.fit_transform(X_scaled)

    points = [
        {'country': country, 'pc1': float(coords[i, 0]), 'pc2': float(coords[i, 1])}
        for i, country in enumerate(countries)
    ]

    return {
        'year': int(most_recent_year),
        'explained_variance': pca.explained_variance_ratio_.tolist(),
        'points': points,
    }
