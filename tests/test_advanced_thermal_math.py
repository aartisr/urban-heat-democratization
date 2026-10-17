import numpy as np
import networkx as nx

from core.advanced_thermal_math import (
    AnalysisLayer,
    brightness_temperature_kelvin,
    dn_to_radiance,
    emissivity_from_fvc,
    fractional_vegetation_cover,
    land_transition,
    markov_transition_matrix,
    moran_lisa,
    minimum_cut_summary,
    ndvi,
    single_channel_lst_celsius,
    threshold_exceedance,
    validate_layer,
)


def test_thermal_calibration_chain_is_vectorized_and_has_expected_units():
    radiance = dn_to_radiance(np.array([32500.0]), 0.0003342, 0.1)
    assert np.allclose(radiance, [10.9615])
    brightness = brightness_temperature_kelvin(radiance, 774.8853, 1321.0789)
    assert 308 < brightness[0] < 311

    vegetation = ndvi(np.array([0.55]), np.array([0.05]))
    fvc = fractional_vegetation_cover(vegetation, 0.2, 0.8)
    emissivity = emissivity_from_fvc(fvc)
    lst = single_channel_lst_celsius(brightness, emissivity, 11.5)
    assert 0 < vegetation[0] < 1
    assert 0 <= fvc[0] <= 1
    assert 0.986 <= emissivity[0] <= 0.99
    assert np.isfinite(lst[0])


def test_lisa_returns_categories_and_fdr_values_without_promoting_causality():
    surface = np.array([
        [1.0, 1.0, 8.0, 8.0],
        [1.0, 1.0, 8.0, 8.0],
        [1.0, 1.0, 8.0, 8.0],
        [1.0, 1.0, 8.0, 8.0],
    ])
    result = moran_lisa(surface, permutations=99, seed=7)
    assert result["global_i"] > 0
    assert result["category"].shape == surface.shape
    assert result["p_adjusted"].shape == surface.shape
    assert set(np.unique(result["category"])).issubset({"high-high", "low-low", "high-low", "low-high", "not-significant", "insufficient"})


def test_persistence_and_transition_keep_missing_data_distinct():
    stack = np.array([[[20.0, np.nan]], [[31.0, np.nan]], [[33.0, np.nan]]])
    persistence = threshold_exceedance(stack, 30.0)
    assert np.allclose(persistence["exceedance_share"][0, 0], 2 / 3)
    assert np.isnan(persistence["exceedance_share"][0, 1])

    transition = land_transition(np.array([[1, 2]]), np.array([[1, 3]]), valid_classes={1, 2, 3})
    assert transition["transition"][0, 0] == "1→1"
    assert transition["change_class"][0, 1] == "changed"
    matrix = markov_transition_matrix(np.array([[1, 2]]), np.array([[1, 3]]), [1, 2, 3])
    assert matrix["counts"][0, 0] == 1
    assert matrix["counts"][1, 2] == 1


def test_explicit_min_cut_is_available_but_requires_a_real_declared_network():
    graph = nx.Graph()
    graph.add_edge("source", "middle", w=2.0)
    graph.add_edge("middle", "target", w=1.0)
    result = minimum_cut_summary(graph, "source", "target")
    assert result["cut_value"] == 1.0


def test_layer_contract_blocks_unvalidated_public_and_ungoverned_context_layers():
    preview = AnalysisLayer(
        id="preview", family="spatial_pattern", display_label="Preview", truth_status="derived",
        validation_status="computationally_verified", method_name="moran", method_version="1",
        source_inputs=("fixture.npy",), parameters={}, interpretation="Pattern only.", limitations=("Not causal.",),
    )
    assert validate_layer(preview) == []
    assert validate_layer(preview, public=True)

    context = AnalysisLayer(
        id="context", family="exposure_context", display_label="Context", truth_status="context",
        validation_status="reference_compared", method_name="aggregate", method_version="1",
        source_inputs=("aggregate.csv",), parameters={}, interpretation="Area context.", limitations=("Not individual risk.",),
    )
    assert any("governance" in error for error in validate_layer(context, public=True))
