import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# ==========================================
# 1. PAGE CONFIG & STYLING
# ==========================================
st.set_page_config(
    page_title="Startup Intelligence Hub",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for a "High-End" Enterprise Look
st.markdown("""
    <style>
    .main {
        background-color: #0e1117;
    }
    div[data-testid="metric-container"] {
        background-color: #1e2130;
        border: 1px solid #3e4255;
        padding: 15px;
        border-radius: 10px;
        color: white;
    }
    .stMetric {
        text-align: center;
    }
    </style>
    """, unsafe_allow_html=True)

# ==========================================
# 2. DATA ENGINE
# ==========================================
@st.cache_data
def load_data():
    try:
        # Attempt to load your actual CSV
        df = pd.read_csv("startup_data.csv")
    except FileNotFoundError:
        # GENERATING HIGH-END SYNTHETIC DATA for demonstration
        np.random.seed(42)
        sectors = ['FinTech', 'HealthTech', 'SaaS', 'AI/ML', 'E-commerce', 'CleanTech']
        regions = ['North America', 'Europe', 'Asia-Pacific', 'LATAM', 'Africa']
        
        data = {
            'Startup_Name': [f"Startup_{i}" for i in range(1000)],
            'Sector': np.random.choice(sectors, 1000),
            'Region': np.random.choice(regions, 1000),
            'Funding_Amount': np.random.lognormal(mean=12, sigma=2, size=1000), 
            'Valuation': np.random.lognormal(mean=15, sigma=2, size=1000),
            'Founder_Experience': np.random.randint(1, 25, 1000),
            'Team_Size': np.random.randint(2, 200, 1000),
            'Years_Active': np.random.randint(1, 12, 1000),
            'Success_Status': np.random.choice([0, 1], 1000, p=[0.7, 0.3]) # 0: Normal, 1: Unicorn
        }
        df = pd.DataFrame(data)
    return df

df = load_data()

# ==========================================
# 3. SIDEBAR NAVIGATION
# ==========================================
with st.sidebar:
    st.title("🚀 Startup Intel")
    st.markdown("---")
    page = st.radio("Navigate To:", ["Executive Overview", "Market Deep-Dive", "AI Success Predictor"])
    st.markdown("---")
    st.info("This dashboard analyzes startup funding patterns and predicts market viability using Random Forest ML.")

# ==========================================
# 4. PAGE 1: EXECUTIVE OVERVIEW
# ==========================================
if page == "Executive Overview":
    st.title("📊 Executive Market Overview")
    st.markdown("A high-level snapshot of the global startup ecosystem.")

    # --- KPI Row ---
    col1, col2, col3, col4 = st.columns(4)
    total_funding = df['Funding_Amount'].sum() / 1e9 # Convert to Billions
    avg_valuation = df['Valuation'].mean() / 1e6 # Convert to Millions
    total_startups = len(df)
    unicorn_rate = (df['Success_Status'].sum() / total_startups) * 100

    col1.metric("Total Capital Deployed", f"${total_funding:.2f}B")
    col2.metric("Avg Valuation", f"${avg_valuation:.2f}M")
    col3.metric("Active Startups", f"{total_startups:,}")
    col4.metric("Unicorn Rate", f"{unicorn_rate:.1f}%")

    st.markdown("---")

    # --- Visuals Row ---
    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("Funding Distribution by Sector")
        fig_sector = px.bar(
            df.groupby('Sector')['Funding_Amount'].sum().sort_values(ascending=False).reset_index(),
            x='Sector', y='Funding_Amount', 
            color='Funding_Amount', color_continuous_scale='Viridis',
            template="plotly_dark"
        )
        st.plotly_chart(fig_sector, use_container_width=True)

    with col_right:
        st.subheader("Regional Market Share")
        fig_pie = px.pie(
            df, names='Region', values='Funding_Amount', 
            hole=0.5, template="plotly_dark",
            color_discrete_sequence=px.colors.sequential.RdBu
        )
        st.plotly_chart(fig_pie, use_container_width=True)

# ==========================================
# 5. PAGE 2: MARKET DEEP-DIVE
# ==========================================
elif page == "Market Deep-Dive":
    st.title("🔍 Market Deep-Dive Analysis")
    
    # Dynamic Filters
    col_f1, col_f2 = st.columns(2)
    with col_f1:
        selected_sector = st.multiselect("Filter by Sector", options=df['Sector'].unique(), default=df['Sector'].unique())
    with col_f2:
        selected_region = st.multiselect("Filter by Region", options=df['Region'].unique(), default=df['Region'].unique())

    filtered_df = df[(df['Sector'].isin(selected_sector)) & (df['Region'].isin(selected_region))]

    # Correlation Matrix
    st.subheader("Feature Correlation Matrix")
    corr = filtered_df[['Funding_Amount', 'Valuation', 'Founder_Experience', 'Team_Size', 'Years_Active']].corr()
    fig_heat = px.imshow(corr, text_auto=True, aspect="auto", template="plotly_dark", color_continuous_scale='RdBu_r')
    st.plotly_chart(fig_heat, use_container_width=True)

    # Valuation vs Funding Scatter
    st.subheader("Valuation vs. Funding Velocity")
    fig_scatter = px.scatter(
        filtered_df, x="Funding_Amount", y="Valuation", 
        color="Sector", size="Team_Size", 
        hover_name="Startup_Name", template="plotly_dark",
        log_x=True, log_y=True
    )
    st.plotly_chart(fig_scatter, use_container_width=True)

# ==========================================
# 6. PAGE 3: AI SUCCESS PREDICTOR
# ==========================================
elif page == "AI Success Predictor":
    st.title("🤖 AI Startup Success Predictor")
    st.markdown("Input your startup's metrics to predict the probability of becoming a **Unicorn**.")

    # --- ML Model Training (On-the-fly) ---
    le = LabelEncoder()
    df_ml = df.copy()
    df_ml['Sector_Enc'] = le.fit_transform(df_ml['Sector'])
    
    X = df_ml[['Funding_Amount', 'Founder_Experience', 'Team_Size', 'Years_Active', 'Sector_Enc']]
    y = df_ml['Success_Status']
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    # --- User Input Form ---
    with st.container():
        col_in1, col_in2 = st.columns(2)
        with col_in1:
            input_funding = st.number_input("Funding Amount ($)", min_value=0, value=1000000)
            input_exp = st.slider("Founder Experience (Years)", 0, 40, 5)
            input_team = st.slider("Current Team Size", 1, 500, 10)
        with col_in2:
            input_years = st.slider("Years since Incorporation", 1, 20, 2)
            input_sector = st.selectbox("Industry Sector", options=df['Sector'].unique())
            sector_enc = le.transform([input_sector])[0]

    # Prediction Logic
    if st.button("Analyze Viability"):
        features = np.array([[input_funding, input_exp, input_team, input_years, sector_enc]])
        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0][1]

        st.markdown("---")
        if prediction == 1:
            st.success(f"### 🎉 High Potential! \n Probability of Unicorn Status: {probability:.1%}")
            st.balloons()
        else:
            st.warning(f"### ⚠️ Moderate Potential \n Probability of Unicorn Status: {probability:.1%}")
            st.info("Suggestion: Focus on increasing team velocity or seeking strategic seed funding in high-growth sectors.")
