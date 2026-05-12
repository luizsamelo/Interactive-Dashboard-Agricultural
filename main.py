from flask import Flask, render_template, jsonify, request
from data import load_filtered_data, compute_pca, build_iso_map, COUNTRIES
import numpy as np

app = Flask(__name__)

def get_df():
    return load_filtered_data()
@app.route('/')
def index():
    df = get_df()
    pca_data = compute_pca(df)
    indicators = [c for c in df.columns if c not in ('Country Name', 'Country Code', 'year')]
    min_year = int(df['year'].min())
    max_year = int(df['year'].max())
    return render_template(
        'index.html',
        pca_data=pca_data,
        indicators=indicators,
        min_year=min_year,
        max_year=max_year,
        countries=COUNTRIES,
        iso_map=build_iso_map(df)
    )

@app.route('/api/pca')
def api_pca():
    df = get_df()
    year = request.args.get('year', None)
    if year is not None:
        year = int(year)
        df_year = df[df['year'] == year].copy()
    else:
        df_year = df  # compute_pca picks most recent year itself
    result = compute_pca(df_year)
    return jsonify(result)

@app.route('/api/choropleth')
def api_choropleth():
    df = get_df()
    indicator = request.args.get('indicator', '')
    year = int(request.args.get('year', int(df['year'].max())))

    df_year = df[df['year'] == year]

    values = {}
    if indicator and indicator in df_year.columns:
        for _, row in df_year.iterrows():
            val = row[indicator]
            if val is not None and not (isinstance(val, float) and np.isnan(val)):
                values[row['Country Name']] = round(float(val), 4)

    return jsonify({'values': values, 'year': year, 'indicator': indicator})

@app.route('/api/timeseries')
def api_timeseries():
    df = get_df()
    countries_param = request.args.get('countries', '')
    indicator = request.args.get('indicator', '')

    selected = [c.strip() for c in countries_param.split(',') if c.strip()]
    if not selected or not indicator or indicator not in df.columns:
        return jsonify({'series': {}})

    sub = df[df['Country Name'].isin(selected)][['Country Name', 'year', indicator]]

    series = {}
    for country, grp in sub.groupby('Country Name'):
        by_year = grp.set_index('year')[indicator].dropna()
        series[country] = {int(yr): round(float(val), 4) for yr, val in by_year.items()}

    return jsonify({'series': series})

@app.route('/api/tooltip')
def api_tooltip():
    df = get_df()
    country = request.args.get('country', '')
    year = int(request.args.get('year', int(df['year'].max())))

    row = df[(df['Country Name'] == country) & (df['year'] == year)]
    if row.empty:
        return jsonify({'country': country, 'year': year, 'values': {}})

    skip = {'Country Name', 'Country Code', 'year'}
    values = {}
    for col in df.columns:
        if col in skip:
            continue
        val = row.iloc[0][col]
        if val is not None and not (isinstance(val, float) and np.isnan(val)):
            values[col] = round(float(val), 2)

    # Return only first 8 for the tooltip
    values = dict(list(values.items())[:8])
    return jsonify({'country': country, 'year': year, 'values': values})


if __name__ == '__main__':
    app.run(debug=True, use_debugger=False)
